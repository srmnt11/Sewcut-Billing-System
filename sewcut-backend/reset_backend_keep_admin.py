# save as sewcut-backend/reset_backend_keep_admin.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sewcut.settings")
django.setup()

from billings.models import Billing, BillingItem, ScheduledEmail
from quotations.models import Quotation, QuotationItem, ScheduledQuotationEmail
from delivery_receipts.models import DeliveryReceipt, DeliveryReceiptItem, ScheduledDeliveryReceiptEmail
from billing_drafts.models import Draft
from clients.models import Client
from suppliers.models import Supplier
from analytics.models import *  # usually no data tables, safe to ignore if unused

def reset_backend_keep_admin():
    print("Deleting business data, keeping users and superuser...")

    # Child tables first where needed
    ScheduledEmail.objects.all().delete()
    BillingItem.objects.all().delete()
    Billing.objects.all().delete()

    ScheduledQuotationEmail.objects.all().delete()
    QuotationItem.objects.all().delete()
    Quotation.objects.all().delete()

    ScheduledDeliveryReceiptEmail.objects.all().delete()
    DeliveryReceiptItem.objects.all().delete()
    DeliveryReceipt.objects.all().delete()

    Draft.objects.all().delete()
    Client.objects.all().delete()
    Supplier.objects.all().delete()

    print("Done. Superuser and auth tables were left untouched.")

if __name__ == "__main__":
    reset_backend_keep_admin()