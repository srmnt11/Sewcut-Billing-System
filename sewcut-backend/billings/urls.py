from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillingViewSet, get_next_billing_number
from .email_views import send_invoice_email, preview_invoice_pdf

router = DefaultRouter()
router.register(r'', BillingViewSet, basename='billing')

urlpatterns = [
    path('next-number/', get_next_billing_number, name='billing-next-number'),
    path('', include(router.urls)),
    path('<int:pk>/send-email/', send_invoice_email, name='send-invoice-email'),
    path('<int:pk>/preview-pdf/', preview_invoice_pdf, name='preview-invoice-pdf'),
]
