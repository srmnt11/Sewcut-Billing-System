from django.db import models
from django.contrib.auth import get_user_model
from clients.models import Client
from quotations.models import Quotation

User = get_user_model()


class Billing(models.Model):
    """Billing/Invoice model"""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Sent', 'Sent'),
        ('Partial Payment', 'Partial Payment'),
        ('Delivered', 'Delivered'),
        ('Paid', 'Paid'),
        ('Cancelled', 'Cancelled'),
    ]

    billing_number = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='billings', null=True, blank=True)
    company_name = models.CharField(max_length=255)
    billing_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    
    # Company Info
    company_email = models.EmailField(blank=True)
    company_phone = models.CharField(max_length=20, blank=True)
    company_address = models.TextField(blank=True)
    
    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Additional Info
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    # Optional source linkage (Quotation -> Invoice)
    source_quotation = models.ForeignKey(
        Quotation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_billings',
    )
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='billings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.billing_number} - {self.company_name}"

    def calculate_totals(self):
        """Calculate all totals based on line items"""
        self.subtotal = sum(item.total for item in self.items.all())
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        self.grand_total = self.subtotal + self.tax_amount - self.discount
        self.save()


class BillingItem(models.Model):
    """Line items for billings/invoices"""
    billing = models.ForeignKey(Billing, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - {self.billing.billing_number}"

class ScheduledEmail(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    billing = models.ForeignKey(Billing, on_delete=models.CASCADE, related_name='scheduled_emails')
    to_email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()   # when to send
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Scheduled email for {self.billing.billing_number} at {self.scheduled_at}"