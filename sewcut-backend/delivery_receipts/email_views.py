import logging
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from .models import DeliveryReceipt, ScheduledDeliveryReceiptEmail
from .pdf_generator import generate_delivery_receipt_pdf
from sewcut.email_delivery import send_email_with_pdf_attachment

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
        delivery = send_email_with_pdf_attachment(
            subject=subject,
            message=message,
            to_email=to_email,
            filename=f'DeliveryReceipt_{receipt.receipt_number}.pdf',
            file_bytes=pdf_buffer.getvalue(),
        )

        return Response(
            {
                'message': 'Delivery receipt sent successfully',
                'sent_to': delivery.get('delivered_to', to_email),
                'provider': delivery.get('provider', 'unknown'),
                'redirected': delivery.get('redirected', False),
            },
            status=status.HTTP_200_OK,
        )
    except Exception as exc:
        logger.error('Error sending delivery receipt email: %s', str(exc))
        return Response({'error': f'Failed to send email: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def schedule_delivery_receipt_email(request, pk):
    """Schedule a delivery receipt email to be sent at a future time."""
    try:
        receipt = DeliveryReceipt.objects.get(pk=pk, created_by=request.user)
    except DeliveryReceipt.DoesNotExist:
        return Response({'error': 'Delivery receipt not found'}, status=status.HTTP_404_NOT_FOUND)

    to_email = request.data.get('to')
    subject = request.data.get('subject', f'Delivery Receipt {receipt.receipt_number}')
    message = request.data.get('message', '')
    scheduled_at = request.data.get('scheduled_at')

    if not to_email:
        return Response({'error': 'Recipient email is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not scheduled_at:
        return Response({'error': 'scheduled_at is required'}, status=status.HTTP_400_BAD_REQUEST)

    scheduled_dt = parse_datetime(scheduled_at)
    if not scheduled_dt:
        return Response({'error': 'Invalid scheduled_at datetime'}, status=status.HTTP_400_BAD_REQUEST)
    if scheduled_dt <= timezone.now():
        return Response({'error': 'Scheduled time must be in the future'}, status=status.HTTP_400_BAD_REQUEST)

    scheduled = ScheduledDeliveryReceiptEmail.objects.create(
        delivery_receipt=receipt,
        to_email=to_email,
        subject=subject,
        message=message,
        scheduled_at=scheduled_dt,
        created_by=request.user,
    )

    return Response({
        'id': scheduled.id,
        'scheduled_at': scheduled.scheduled_at,
        'to_email': scheduled.to_email,
        'status': scheduled.status,
        'message': 'Delivery receipt email scheduled successfully',
    }, status=status.HTTP_201_CREATED)


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
