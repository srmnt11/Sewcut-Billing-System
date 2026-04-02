import logging
from django.conf import settings
from django.core.mail import EmailMessage
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import DeliveryReceipt
from .pdf_generator import generate_delivery_receipt_pdf

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_delivery_receipt_email(request, pk):
    """Send delivery receipt via email with PDF attachment."""
    try:
        receipt = DeliveryReceipt.objects.get(pk=pk, created_by=request.user)
    except DeliveryReceipt.DoesNotExist:
        return Response({'error': 'Delivery receipt not found'}, status=status.HTTP_404_NOT_FOUND)

    to_email = request.data.get('to')
    subject = request.data.get('subject', f'Delivery Receipt {receipt.receipt_number}')
    message = request.data.get('message', '')

    if not to_email:
        return Response({'error': 'Recipient email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pdf_buffer = generate_delivery_receipt_pdf(receipt)

        email = EmailMessage(
            subject=subject,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        email.attach(
            f'DeliveryReceipt_{receipt.receipt_number}.pdf',
            pdf_buffer.getvalue(),
            'application/pdf',
        )
        email.send(fail_silently=False)

        return Response({'message': 'Delivery receipt sent successfully'}, status=status.HTTP_200_OK)
    except Exception as exc:
        logger.error('Error sending delivery receipt email: %s', str(exc))
        return Response({'error': f'Failed to send email: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def preview_delivery_receipt_pdf(request, pk):
    """Generate and return delivery receipt PDF for preview/print."""
    try:
        receipt = DeliveryReceipt.objects.get(pk=pk, created_by=request.user)
    except DeliveryReceipt.DoesNotExist:
        return Response({'error': 'Delivery receipt not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        pdf_buffer = generate_delivery_receipt_pdf(receipt)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="DeliveryReceipt_{receipt.receipt_number}.pdf"'
        return response
    except Exception as exc:
        logger.error('Error generating delivery receipt PDF: %s', str(exc))
        return Response(
            {'error': f'Failed to generate PDF: {str(exc)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
