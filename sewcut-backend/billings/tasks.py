import logging

from celery import shared_task
from django.utils import timezone

from billings.models import ScheduledEmail
from billings.pdf_generator import generate_invoice_pdf
from sewcut.email_delivery import send_email_with_pdf_attachment


logger = logging.getLogger(__name__)


def _deliver_scheduled_email(scheduled_email: ScheduledEmail) -> bool:
    if scheduled_email.status != 'pending':
        return False

    try:
        pdf_buffer = generate_invoice_pdf(scheduled_email.billing)
        send_email_with_pdf_attachment(
            subject=scheduled_email.subject,
            message=scheduled_email.message,
            to_email=scheduled_email.to_email,
            filename=f'Invoice_{scheduled_email.billing.billing_number}.pdf',
            file_bytes=pdf_buffer.getvalue(),
        )

        scheduled_email.status = 'sent'
        scheduled_email.sent_at = timezone.now()
        scheduled_email.error_message = ''
        scheduled_email.save(update_fields=['status', 'sent_at', 'error_message'])

        if scheduled_email.billing.status == 'Pending':
            scheduled_email.billing.status = 'Sent'
            scheduled_email.billing.save(update_fields=['status'])

        logger.info(
            'Sent scheduled email %s for billing %s',
            scheduled_email.id,
            scheduled_email.billing.billing_number,
        )
        return True
    except Exception as exc:
        scheduled_email.status = 'failed'
        scheduled_email.error_message = str(exc)
        scheduled_email.save(update_fields=['status', 'error_message'])
        logger.exception('Failed to send scheduled email %s', scheduled_email.id)
        return False


def _send_scheduled_email(scheduled_email: ScheduledEmail) -> bool:
    return _deliver_scheduled_email(scheduled_email)


def process_due_scheduled_emails() -> int:
    due_emails = (
        ScheduledEmail.objects.filter(status='pending', scheduled_at__lte=timezone.now())
        .select_related('billing')
        .order_by('scheduled_at')
    )

    processed = 0
    for scheduled_email in due_emails:
        if _send_scheduled_email(scheduled_email):
            processed += 1

    return processed


@shared_task(name='billings.tasks.send_scheduled_email')
def send_scheduled_email(scheduled_email_id: int):
    try:
        scheduled_email = ScheduledEmail.objects.select_related('billing').get(id=scheduled_email_id)
    except ScheduledEmail.DoesNotExist:
        logger.warning('Scheduled email %s no longer exists', scheduled_email_id)
        return False

    if scheduled_email.status != 'pending':
        return False

    return _deliver_scheduled_email(scheduled_email)


@shared_task(name='billings.tasks.send_due_scheduled_emails')
def send_due_scheduled_emails():
    return process_due_scheduled_emails()