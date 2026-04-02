import re
from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes as drf_permission_classes
from rest_framework.response import Response
from .models import DeliveryReceipt
from .serializers import DeliveryReceiptSerializer
from billings.models import Billing


@api_view(['GET'])
@drf_permission_classes([permissions.IsAuthenticated])
def get_next_delivery_receipt_number(request):
    """Return the next sequential delivery receipt number."""
    last = DeliveryReceipt.objects.order_by('-id').first()
    next_num = 1
    if last and last.receipt_number:
        match = re.search(r'(\d+)$', last.receipt_number)
        if match:
            next_num = int(match.group(1)) + 1
        else:
            next_num = DeliveryReceipt.objects.count() + 1
    return Response({'number': f'DR-{next_num:04d}'})


class DeliveryReceiptViewSet(viewsets.ModelViewSet):
    """CRUD operations for delivery receipts."""

    serializer_class = DeliveryReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DeliveryReceipt.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        sort_param = request.query_params.get('_sort', '-created_at')
        if sort_param:
            field_map = {
                'createdAt': 'created_at',
                'updatedAt': 'updated_at',
                'receiptNumber': 'receipt_number',
                'clientName': 'client_name',
                'deliveryDate': 'delivery_date',
                'status': 'status',
            }
            desc = sort_param.startswith('-')
            field = sort_param.lstrip('-')
            db_field = field_map.get(field, field)
            queryset = queryset.order_by(f'-{db_field}' if desc else db_field)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        total = queryset.count()
        draft = queryset.filter(status='Draft').count()
        issued = queryset.filter(status='Issued').count()

        return Response({
            'total': total,
            'draft': draft,
            'issued': issued,
        })

    @action(detail=False, methods=['get'])
    def next_number(self, request):
        queryset = self.get_queryset()
        last = queryset.order_by('-id').first()
        next_num = 1
        if last and last.receipt_number:
            match = re.search(r'(\d+)$', last.receipt_number)
            if match:
                next_num = int(match.group(1)) + 1
            else:
                next_num = queryset.count() + 1
        return Response({'number': f'DR-{next_num:04d}'})

    @action(detail=False, methods=['get'])
    def autofill_sources(self, request):
        """List invoices available for delivery receipt autofill."""
        invoices = Billing.objects.filter(status__in=['Delivered', 'Paid']).order_by('-created_at')
        data = [
            {
                'id': invoice.id,
                'billingNumber': invoice.billing_number,
                'companyName': invoice.company_name,
                'billingDate': invoice.billing_date,
                'grandTotal': invoice.grand_total,
                'status': invoice.status,
            }
            for invoice in invoices
        ]
        return Response(data)

    @action(detail=False, methods=['get'])
    def autofill_from_invoice(self, request):
        """Return delivery receipt-ready payload mapped from an existing invoice."""
        invoice_id = request.query_params.get('invoice_id')
        if not invoice_id:
            return Response({'detail': 'invoice_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invoice = Billing.objects.get(pk=invoice_id)
        except Billing.DoesNotExist:
            return Response({'detail': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)

        items = [
            {
                'description': item.description,
                'quantity': float(item.quantity),
                'unit': '',
                'remarks': '',
            }
            for item in invoice.items.all()
        ]

        payload = {
            'sourceBillingId': invoice.id,
            'client': invoice.client_id,
            'clientName': invoice.company_name,
            'deliveryDate': datetime.now().date().isoformat(),
            'address': invoice.company_address or '',
            'contactPerson': invoice.company_name,
            'referenceNumber': invoice.billing_number,
            'notes': invoice.notes or '',
            'status': 'Draft',
            'items': items,
        }
        return Response(payload)
