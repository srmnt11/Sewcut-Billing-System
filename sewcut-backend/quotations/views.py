from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes as drf_permission_classes
from rest_framework.response import Response
from .models import Quotation
from .serializers import QuotationSerializer
import re


@api_view(['GET'])
@drf_permission_classes([permissions.IsAuthenticated])
def get_next_quotation_number(request):
    """Return the next sequential quotation number."""
    last = Quotation.objects.order_by('-id').first()
    next_num = 1
    if last and last.quotation_number:
        match = re.search(r'(\d+)$', last.quotation_number)
        if match:
            next_num = int(match.group(1)) + 1
        else:
            next_num = Quotation.objects.count() + 1
    return Response({'number': f'QT-{next_num:04d}'})


class QuotationViewSet(viewsets.ModelViewSet):
    """CRUD operations for quotations"""
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
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
                'updatedAt': 'updated_at',
                'quotationDate': 'quotation_date',
                'validUntil': 'valid_until',
                'companyName': 'company_name',
                'grandTotal': 'grand_total',
                'quotationNumber': 'quotation_number',
            }
            desc = sort_param.startswith('-')
            field = sort_param.lstrip('-')
            db_field = field_map.get(field, field)
            queryset = queryset.order_by(f'-{db_field}' if desc else db_field)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get quotation statistics"""
        total = Quotation.objects.count()
        draft = Quotation.objects.filter(status='Draft').count()
        pending = Quotation.objects.filter(status='Pending').count()
        sent = Quotation.objects.filter(status='Sent').count()
        accepted = Quotation.objects.filter(status='Accepted').count()
        rejected = Quotation.objects.filter(status='Rejected').count()
        
        return Response({
            'total': total,
            'draft': draft,
            'pending': pending,
            'sent': sent,
            'accepted': accepted,
            'rejected': rejected,
        })

    @action(detail=False, methods=['get'])
    def next_number(self, request):
        """Return the next sequential quotation number."""
        import re
        last = Quotation.objects.order_by('-id').first()
        next_num = 1
        if last and last.quotation_number:
            match = re.search(r'(\d+)$', last.quotation_number)
            if match:
                next_num = int(match.group(1)) + 1
            else:
                next_num = Quotation.objects.count() + 1
        return Response({'number': f'QT-{next_num:04d}'})
