from django.core.management.base import BaseCommand
from billings.tasks import process_due_scheduled_emails


class Command(BaseCommand):
    help = 'Send all pending scheduled emails that are due'

    def handle(self, *args, **options):
        processed = process_due_scheduled_emails()
        self.stdout.write(self.style.SUCCESS(f'Processed {processed} scheduled email(s).'))