from django.core.management.base import BaseCommand
from django.utils import timezone
from billings.models import ScheduledEmail
from billings.pdf_generator import generate_invoice_pdf
from sewcut.email_delivery import send_email_with_pdf_attachment
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send all pending scheduled emails that are due'

    def handle(self, *args, **options):
        due = ScheduledEmail.objects.filter(
            status='pending',
            scheduled_at__lte=timezone.now()
        ).select_related('billing')

        self.stdout.write(f'Found {due.count()} email(s) due.')

        for scheduled in due:
            try:
                pdf_buffer = generate_invoice_pdf(scheduled.billing)
                send_email_with_pdf_attachment(
                    subject=scheduled.subject,
                    message=scheduled.message,
                    to_email=scheduled.to_email,
                    filename=f'Invoice_{scheduled.billing.billing_number}.pdf',
                    file_bytes=pdf_buffer.getvalue(),
                )
                scheduled.status = 'sent'
                scheduled.sent_at = timezone.now()

                # Auto-advance billing status
                if scheduled.billing.status == 'Pending':
                    scheduled.billing.status = 'Sent'
                    scheduled.billing.save()

                self.stdout.write(self.style.SUCCESS(
                    f'Sent scheduled email {scheduled.id} for {scheduled.billing.billing_number}'
                ))
            except Exception as e:
                scheduled.status = 'failed'
                scheduled.error_message = str(e)
                logger.error(f'Failed to send scheduled email {scheduled.id}: {e}')
                self.stdout.write(self.style.ERROR(f'Failed: {e}'))
            finally:
                scheduled.save()