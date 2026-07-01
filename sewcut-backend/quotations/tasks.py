import logging

from celery import shared_task
from django.utils import timezone

from quotations.models import ScheduledQuotationEmail
from quotations.pdf_generator import generate_quotation_pdf
from sewcut.email_delivery import send_email_with_pdf_attachment


logger = logging.getLogger(__name__)


def _deliver_scheduled_quotation_email(scheduled_email: ScheduledQuotationEmail) -> bool:
    if scheduled_email.status != 'pending':
        return False

    try:
        pdf_buffer = generate_quotation_pdf(scheduled_email.quotation)
        send_email_with_pdf_attachment(
            subject=scheduled_email.subject,
            message=scheduled_email.message,
            to_email=scheduled_email.to_email,
            filename=f'Quotation_{scheduled_email.quotation.quotation_number}.pdf',
            file_bytes=pdf_buffer.getvalue(),
        )

        scheduled_email.status = 'sent'
        scheduled_email.sent_at = timezone.now()
        scheduled_email.error_message = ''
        scheduled_email.save(update_fields=['status', 'sent_at', 'error_message'])

        if scheduled_email.quotation.status in ['Draft', 'Pending']:
            scheduled_email.quotation.status = 'Sent'
            scheduled_email.quotation.save(update_fields=['status'])

        logger.info(
            'Sent scheduled quotation email %s for quotation %s',
            scheduled_email.id,
            scheduled_email.quotation.quotation_number,
        )
        return True
    except Exception as exc:
        scheduled_email.status = 'failed'
        scheduled_email.error_message = str(exc)
        scheduled_email.save(update_fields=['status', 'error_message'])
        logger.exception('Failed to send scheduled quotation email %s', scheduled_email.id)
        return False


def process_due_scheduled_quotation_emails() -> int:
    due_emails = (
        ScheduledQuotationEmail.objects.filter(status='pending', scheduled_at__lte=timezone.now())
        .select_related('quotation')
        .order_by('scheduled_at')
    )

    processed = 0
    for scheduled_email in due_emails:
        if _deliver_scheduled_quotation_email(scheduled_email):
            processed += 1

    return processed


@shared_task(name='quotations.tasks.send_due_scheduled_quotation_emails')
def send_due_scheduled_quotation_emails():
    return process_due_scheduled_quotation_emails()