from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .models import Billing
from .pdf_generator import generate_invoice_pdf
from sewcut.email_delivery import send_email_with_pdf_attachment
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_invoice_email(request, pk):
    """Send invoice via email with PDF attachment"""
    try:
        billing = Billing.objects.get(pk=pk, created_by=request.user)
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
        send_email_with_pdf_attachment(
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
            'sent_to': to_email
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
        billing = Billing.objects.get(pk=pk, created_by=request.user)
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
