from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes as drf_permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta
from .models import Billing
from .serializers import BillingSerializer
import re


@api_view(['GET'])
@drf_permission_classes([permissions.IsAuthenticated])
def get_next_billing_number(request):
    """Return the next sequential invoice number."""
    last = Billing.objects.order_by('-id').first()
    next_num = 1
    if last and last.billing_number:
        match = re.search(r'(\d+)$', last.billing_number)
        if match:
            next_num = int(match.group(1)) + 1
        else:
            next_num = Billing.objects.count() + 1
    return Response({'number': f'INV-{next_num:04d}'})


class BillingViewSet(viewsets.ModelViewSet):
    """CRUD operations for billings/invoices"""
    queryset = Billing.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Support sorting with camelCase to snake_case conversion
        sort_param = request.query_params.get('_sort', '-created_at')
        if sort_param:
            field_map = {
                'createdAt': 'created_at',
                'billingDate': 'billing_date',
                'dueDate': 'due_date',
                'companyName': 'company_name',
                'grandTotal': 'grand_total',
                'billingNumber': 'billing_number',
                'updatedAt': 'updated_at',
            }
            desc = sort_param.startswith('-')
            field = sort_param.lstrip('-')
            db_field = field_map.get(field, field)
            queryset = queryset.order_by(f'-{db_field}' if desc else db_field)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get billing statistics - count 50% for Partial Payment, 100% for Delivered and Paid"""
        total = Billing.objects.count()
        pending = Billing.objects.filter(status='Pending').count()
        sent = Billing.objects.filter(status='Sent').count()
        partial = Billing.objects.filter(status='Partial Payment').count()
        delivered = Billing.objects.filter(status='Delivered').count()
        paid = Billing.objects.filter(status='Paid').count()
        
        # Calculate revenue: 50% for Partial Payment, 100% for Delivered and Paid
        partial_revenue = Billing.objects.filter(status='Partial Payment').aggregate(
            Sum('grand_total'))['grand_total__sum'] or 0
        full_revenue = Billing.objects.filter(
            status__in=['Delivered', 'Paid']
        ).aggregate(Sum('grand_total'))['grand_total__sum'] or 0
        
        total_revenue = (float(partial_revenue) * 0.5) + float(full_revenue)
        
        return Response({
            'total': total,
            'pending': pending,
            'sent': sent,
            'partial': partial,
            'delivered': delivered,
            'paid': paid,
            'totalRevenue': total_revenue,
        })

    @action(detail=False, methods=['get'])
    def next_number(self, request):
        """Return the next sequential invoice number."""
        import re
        last = Billing.objects.order_by('-id').first()
        next_num = 1
        if last and last.billing_number:
            match = re.search(r'(\d+)$', last.billing_number)
            if match:
                next_num = int(match.group(1)) + 1
            else:
                next_num = Billing.objects.count() + 1
        return Response({'number': f'INV-{next_num:04d}'})
