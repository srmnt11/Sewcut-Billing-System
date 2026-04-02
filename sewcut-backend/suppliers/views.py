from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Supplier
from .serializers import SupplierSerializer
from django.utils import timezone
from datetime import timedelta


class SupplierViewSet(viewsets.ModelViewSet):
    """CRUD operations for suppliers"""
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
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
                'contactPerson': 'contact_person',
            }
            desc = sort_param.startswith('-')
            field = sort_param.lstrip('-')
            db_field = field_map.get(field, field)
            queryset = queryset.order_by(f'-{db_field}' if desc else db_field)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get supplier statistics"""
        total = Supplier.objects.count()
        active = Supplier.objects.filter(status='active').count()
        inactive = Supplier.objects.filter(status='inactive').count()
        
        return Response({
            'total': total,
            'active': active,
            'inactive': inactive,
        })

    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Return performance metrics for a specific supplier.
        Metrics are derived from available system data.
        No purchase-order table exists yet, so we return honest zeros
        along with basic computed info like supplier age."""
        supplier = self.get_object()
        
        days_since_added = (timezone.now() - supplier.created_at).days

        return Response({
            'supplierId': supplier.id,
            'supplierName': supplier.name,
            'hasData': False,  # Flip to True once purchase orders are tracked
            'qualityRating': 0,
            'onTimeDelivery': 0,
            'totalOrders': 0,
            'totalSpent': 0,
            'averageLeadTime': 0,
            'defectRate': 0,
            'daysSinceAdded': days_since_added,
            'status': supplier.status,
            'category': supplier.category,
        })


