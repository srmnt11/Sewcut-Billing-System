import logging

from celery import shared_task
from django.utils import timezone

from delivery_receipts.models import ScheduledDeliveryReceiptEmail
from delivery_receipts.pdf_generator import generate_delivery_receipt_pdf
from sewcut.email_delivery import send_email_with_pdf_attachment


logger = logging.getLogger(__name__)


def _deliver_scheduled_delivery_receipt_email(scheduled_email: ScheduledDeliveryReceiptEmail) -> bool:
    if scheduled_email.status != 'pending':
        return False

    try:
        pdf_buffer = generate_delivery_receipt_pdf(scheduled_email.delivery_receipt)
        send_email_with_pdf_attachment(
            subject=scheduled_email.subject,
            message=scheduled_email.message,
            to_email=scheduled_email.to_email,
            filename=f'DeliveryReceipt_{scheduled_email.delivery_receipt.receipt_number}.pdf',
            file_bytes=pdf_buffer.getvalue(),
        )

        scheduled_email.status = 'sent'
        scheduled_email.sent_at = timezone.now()
        scheduled_email.error_message = ''
        scheduled_email.save(update_fields=['status', 'sent_at', 'error_message'])
        logger.info(
            'Sent scheduled delivery receipt email %s for receipt %s',
            scheduled_email.id,
            scheduled_email.delivery_receipt.receipt_number,
        )
        return True
    except Exception as exc:
        scheduled_email.status = 'failed'
        scheduled_email.error_message = str(exc)
        scheduled_email.save(update_fields=['status', 'error_message'])
        logger.exception('Failed to send scheduled delivery receipt email %s', scheduled_email.id)
        return False


def process_due_scheduled_delivery_receipt_emails() -> int:
    due_emails = (
        ScheduledDeliveryReceiptEmail.objects.filter(status='pending', scheduled_at__lte=timezone.now())
        .select_related('delivery_receipt')
        .order_by('scheduled_at')
    )

    processed = 0
    for scheduled_email in due_emails:
        if _deliver_scheduled_delivery_receipt_email(scheduled_email):
            processed += 1

    return processed


@shared_task(name='delivery_receipts.tasks.send_due_scheduled_delivery_receipt_emails')
def send_due_scheduled_delivery_receipt_emails():
    return process_due_scheduled_delivery_receipt_emails()