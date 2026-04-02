from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import DeliveryReceiptViewSet, get_next_delivery_receipt_number
from .email_views import preview_delivery_receipt_pdf, send_delivery_receipt_email

router = DefaultRouter()
router.register(r'', DeliveryReceiptViewSet, basename='delivery-receipt')

urlpatterns = [
    path('next-number/', get_next_delivery_receipt_number, name='delivery-receipt-next-number'),
    path('', include(router.urls)),
    path('<int:pk>/send-email/', send_delivery_receipt_email, name='delivery-receipt-send-email'),
    path('<int:pk>/preview-pdf/', preview_delivery_receipt_pdf, name='delivery-receipt-preview-pdf'),
]
