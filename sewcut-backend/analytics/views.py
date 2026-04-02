from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncMonth, TruncDate
from datetime import datetime, timedelta
from billings.models import Billing
from clients.models import Client
from quotations.models import Quotation
from suppliers.models import Supplier


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get overall dashboard statistics"""
    
    # Revenue stats: 100% for Paid/Delivered, 50% for Partial Payment
    paid_delivered_revenue = Billing.objects.filter(
        status__in=['Paid', 'Delivered']
    ).aggregate(Sum('grand_total'))['grand_total__sum'] or 0
    
    partial_revenue = Billing.objects.filter(
        status='Partial Payment'
    ).aggregate(Sum('grand_total'))['grand_total__sum'] or 0
    
    total_revenue = float(paid_delivered_revenue) + (float(partial_revenue) * 0.5)
    
    # This month's revenue: 100% for Paid/Delivered, 50% for Partial Payment
    today = datetime.now()
    first_day = today.replace(day=1)
    
    this_month_paid_delivered = Billing.objects.filter(
        billing_date__gte=first_day,
        status__in=['Paid', 'Delivered']
    ).aggregate(Sum('grand_total'))['grand_total__sum'] or 0
    
    this_month_partial = Billing.objects.filter(
        billing_date__gte=first_day,
        status='Partial Payment'
    ).aggregate(Sum('grand_total'))['grand_total__sum'] or 0
    
    this_month_revenue = float(this_month_paid_delivered) + (float(this_month_partial) * 0.5)
    
    # Counts
    total_invoices = Billing.objects.count()
    total_clients = Client.objects.filter(status='active').count()
    total_quotations = Quotation.objects.count()
    pending_invoices = Billing.objects.filter(status__in=['Pending', 'Sent']).count()
    
    # Recent activity
    recent_invoices = Billing.objects.order_by('-created_at')[:5].values(
        'id', 'billing_number', 'company_name', 'grand_total', 'status', 'billing_date'
    )
    
    return Response({
        'totalRevenue': float(total_revenue),
        'thisMonthRevenue': float(this_month_revenue),
        'totalInvoices': total_invoices,
        'totalClients': total_clients,
        'totalQuotations': total_quotations,
        'pendingInvoices': pending_invoices,
        'recentInvoices': list(recent_invoices),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_chart(request):
    """Get revenue data for charts"""
    from django.db.models import Case, When, F, DecimalField
    
    # Get revenue by month for last 12 months
    # Apply 50% for Partial Payment, 100% for Paid/Delivered
    twelve_months_ago = datetime.now() - timedelta(days=365)
    
    monthly_revenue = Billing.objects.filter(
        billing_date__gte=twelve_months_ago,
        status__in=['Paid', 'Delivered', 'Partial Payment']
    ).annotate(
        month=TruncMonth('billing_date'),
        adjusted_revenue=Case(
            When(status='Partial Payment', then=F('grand_total') * 0.5),
            default=F('grand_total'),
            output_field=DecimalField(max_digits=10, decimal_places=2)
        )
    ).values('month').annotate(
        revenue=Sum('adjusted_revenue')
    ).order_by('month')
    
    return Response({
        'monthlyRevenue': [
            {
                'month': item['month'].strftime('%b %Y'),
                'revenue': float(item['revenue'] or 0)
            }
            for item in monthly_revenue
        ]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_clients(request):
    """Get top clients by revenue"""
    from django.db.models import F, Case, When, DecimalField
    
    # Get all billings and aggregate by client
    # Apply 50% for Partial Payment, 100% for Paid/Delivered
    top_clients_data = Billing.objects.filter(
        status__in=['Paid', 'Delivered', 'Partial Payment']
    ).annotate(
        adjusted_revenue=Case(
            When(status='Partial Payment', then=F('grand_total') * 0.5),
            default=F('grand_total'),
            output_field=DecimalField(max_digits=10, decimal_places=2)
        )
    ).values('company_name').annotate(
        total_revenue=Sum('adjusted_revenue'),
        invoice_count=Count('id')
    ).order_by('-total_revenue')[:10]
    
    return Response({
        'topClients': [
            {
                'name': item['company_name'],
                'revenue': float(item['total_revenue'] or 0),
                'invoiceCount': item['invoice_count']
            }
            for item in top_clients_data
        ]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def invoice_status_distribution(request):
    """Get distribution of invoice statuses"""
    
    status_counts = Billing.objects.values('status').annotate(
        count=Count('id'),
        total_amount=Sum('grand_total')
    )
    
    return Response({
        'statusDistribution': [
            {
                'status': item['status'],
                'count': item['count'],
                'totalAmount': float(item['total_amount'] or 0)
            }
            for item in status_counts
        ]
    })

