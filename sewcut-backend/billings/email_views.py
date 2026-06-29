from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.http import HttpResponse
from .models import Billing
from .models import ScheduledEmail
from .pdf_generator import generate_invoice_pdf
from sewcut.email_delivery import send_email_with_pdf_attachment
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_invoice_email(request, pk):
    """Send invoice via email with PDF attachment"""
    try:
        billing = Billing.objects.get(pk=pk)
    except Billing.DoesNotExist:
        return Response(
            {'error': 'Invoice not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get email data from request
    to_email = request.data.get('to')
    subject = request.data.get('subject', f'Invoice {billing.billing_number}')
    message = request.data.get('message', '')

    if not to_email:
        return Response(
            {'error': 'Recipient email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Generate PDF
        pdf_buffer = generate_invoice_pdf(billing)
        delivery = send_email_with_pdf_attachment(
            subject=subject,
            message=message,
            to_email=to_email,
            filename=f'Invoice_{billing.billing_number}.pdf',
            file_bytes=pdf_buffer.getvalue(),
        )
        
        # Update billing status to 'Sent' if currently 'Pending'
        if billing.status == 'Pending':
            billing.status = 'Sent'
            billing.save()
        
        logger.info(f'Invoice {billing.billing_number} sent to {to_email}')
        
        return Response({
            'message': 'Email sent successfully',
            'billing_number': billing.billing_number,
            'sent_to': delivery.get('delivered_to', to_email),
            'provider': delivery.get('provider', 'unknown'),
            'redirected': delivery.get('redirected', False),
        })
        
    except Exception as e:
        logger.error(f'Error sending email: {str(e)}')
        return Response(
            {'error': f'Failed to send email: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def preview_invoice_pdf(request, pk):
    """Generate and return invoice PDF for preview"""
    try:
        billing = Billing.objects.get(pk=pk)
    except Billing.DoesNotExist:
        return Response(
            {'error': 'Invoice not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        # Generate PDF
        pdf_buffer = generate_invoice_pdf(billing)
        
        # Return PDF response
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Invoice_{billing.billing_number}.pdf"'
        
        return response
        
    except Exception as e:
        logger.error(f'Error generating PDF: {str(e)}')
        return Response(
            {'error': f'Failed to generate PDF: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def schedule_invoice_email(request, pk):
    """Schedule an invoice email to be sent at a future time."""
    try:
        billing = Billing.objects.get(pk=pk)
    except Billing.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)

    to_email = request.data.get('to')
    subject = request.data.get('subject', f'Invoice {billing.billing_number}')
    message = request.data.get('message', '')
    scheduled_at = request.data.get('scheduled_at')   # ISO-8601 string

    if not to_email:
        return Response({'error': 'Recipient email is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not scheduled_at:
        return Response({'error': 'scheduled_at is required'}, status=status.HTTP_400_BAD_REQUEST)

    from django.utils.dateparse import parse_datetime
    scheduled_dt = parse_datetime(scheduled_at)
    if not scheduled_dt:
        return Response({'error': 'Invalid scheduled_at datetime'}, status=status.HTTP_400_BAD_REQUEST)
    if scheduled_dt <= timezone.now():
        return Response({'error': 'Scheduled time must be in the future'}, status=status.HTTP_400_BAD_REQUEST)

    scheduled = ScheduledEmail.objects.create(
        billing=billing,
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
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_scheduled_email(request, pk, scheduled_id):
    """List or cancel a scheduled email."""
    try:
        billing = Billing.objects.get(pk=pk)
        scheduled = ScheduledEmail.objects.get(id=scheduled_id, billing=billing)
    except (Billing.DoesNotExist, ScheduledEmail.DoesNotExist):
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        if scheduled.status != 'pending':
            return Response({'error': 'Only pending emails can be cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        scheduled.status = 'cancelled'
        scheduled.save()
        return Response({'message': 'Scheduled email cancelled'})

    return Response({
        'id': scheduled.id,
        'to_email': scheduled.to_email,
        'subject': scheduled.subject,
        'scheduled_at': scheduled.scheduled_at,
        'status': scheduled.status,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_scheduled_emails(request, pk):
    """List all scheduled emails for an invoice."""
    try:
        billing = Billing.objects.get(pk=pk)
    except Billing.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)

    scheduled = ScheduledEmail.objects.filter(billing=billing).order_by('scheduled_at')
    return Response([{
        'id': s.id,
        'to_email': s.to_email,
        'subject': s.subject,
        'scheduled_at': s.scheduled_at,
        'status': s.status,
        'sent_at': s.sent_at,
        'error_message': s.error_message,
    } for s in scheduled])
