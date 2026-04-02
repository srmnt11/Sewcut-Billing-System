import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewcut.settings')
django.setup()

from billings.models import Billing

# Delete all billings with Draft status
draft_billings = Billing.objects.filter(status='Draft')
count = draft_billings.count()
draft_billings.delete()

print(f"Deleted {count} billings with Draft status")
