import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewcut.settings')
django.setup()

from billing_drafts.models import Draft

# Delete all sample drafts
deleted_count = Draft.objects.all().delete()[0]
print(f"✅ Deleted {deleted_count} sample drafts")
