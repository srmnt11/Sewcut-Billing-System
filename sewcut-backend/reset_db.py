import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewcut.settings')
django.setup()

from django.contrib.auth import get_user_model
from billings.models import Billing, BillingItem
from clients.models import Client
from quotations.models import Quotation
from suppliers.models import Supplier

User = get_user_model()

def reset_database():
    print("Deleting all data...")
    
    # Delete all records
    BillingItem.objects.all().delete()
    Billing.objects.all().delete()
    Quotation.objects.all().delete()
    Client.objects.all().delete()
    Supplier.objects.all().delete()
    User.objects.all().delete()
    
    print("Creating superuser...")
    # Create admin user
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@sewcut.com',
        password='admin123',
        role='admin'
    )
    
    print("Database reset complete!")
    print("Login credentials:")
    print("  Username: admin")
    print("  Password: admin123")

if __name__ == '__main__':
    reset_database()
