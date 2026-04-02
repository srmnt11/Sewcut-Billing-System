from django.urls import path
from .views import dashboard_stats, revenue_chart, top_clients, invoice_status_distribution

urlpatterns = [
    path('dashboard/', dashboard_stats, name='dashboard_stats'),
    path('revenue-chart/', revenue_chart, name='revenue_chart'),
    path('top-clients/', top_clients, name='top_clients'),
    path('invoice-status/', invoice_status_distribution, name='invoice_status'),
]
