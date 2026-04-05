from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .models import Quotation
from .pdf_generator import generate_quotation_pdf
from sewcut.email_delivery import send_email_with_pdf_attachment
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_quotation_email(request, pk):
    """Send quotation via email with PDF attachment"""
    try:
        quotation = Quotation.objects.get(pk=pk, created_by=request.user)
    except Quotation.DoesNotExist:
        return Response(
            {'error': 'Quotation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get email data from request
    to_email = request.data.get('to')
    subject = request.data.get('subject', f'Quotation {quotation.quotation_number}')
    message = request.data.get('message', '')

    if not to_email:
        return Response(
            {'error': 'Recipient email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Generate PDF
        pdf_buffer = generate_quotation_pdf(quotation)
        delivery = send_email_with_pdf_attachment(
            subject=subject,
            message=message,
            to_email=to_email,
            filename=f'Quotation_{quotation.quotation_number}.pdf',
            file_bytes=pdf_buffer.getvalue(),
        )
        
        # Update quotation workflow status after successful send.
        if quotation.status in ['Draft', 'Pending']:
            quotation.status = 'Sent'
            quotation.save()
        
        logger.info(f'Quotation {quotation.quotation_number} sent to {to_email}')
        
        return Response({
            'message': 'Email sent successfully',
            'quotation_number': quotation.quotation_number,
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
def preview_quotation_pdf(request, pk):
    """Generate and return quotation PDF for preview"""
    try:
        quotation = Quotation.objects.get(pk=pk, created_by=request.user)
    except Quotation.DoesNotExist:
        return Response(
            {'error': 'Quotation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        # Generate PDF
        pdf_buffer = generate_quotation_pdf(quotation)
        
        # Return PDF response
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Quotation_{quotation.quotation_number}.pdf"'
        
        return response
        
    except Exception as e:
        logger.error(f'Error generating PDF: {str(e)}')
        return Response(
            {'error': f'Failed to generate PDF: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
