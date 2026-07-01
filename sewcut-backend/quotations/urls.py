from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuotationViewSet, get_next_quotation_number
from .email_views import send_quotation_email, preview_quotation_pdf, schedule_quotation_email

router = DefaultRouter()
router.register(r'', QuotationViewSet, basename='quotation')

urlpatterns = [
    path('next-number/', get_next_quotation_number, name='quotation-next-number'),
    path('', include(router.urls)),
    path('<int:pk>/send-email/', send_quotation_email, name='quotation-send-email'),
    path('<int:pk>/schedule-email/', schedule_quotation_email, name='quotation-schedule-email'),
    path('<int:pk>/preview-pdf/', preview_quotation_pdf, name='quotation-preview-pdf'),
]
