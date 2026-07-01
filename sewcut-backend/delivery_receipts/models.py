from django.db import models
from django.contrib.auth import get_user_model
from clients.models import Client
from billings.models import Billing

User = get_user_model()


class DeliveryReceipt(models.Model):
    """Delivery receipt header information."""

    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Issued', 'Issued'),
    ]

    receipt_number = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='delivery_receipts', null=True, blank=True)
    client_name = models.CharField(max_length=255)
    delivery_date = models.DateField()
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')

    # Optional source linkage (Invoice -> Delivery Receipt)
    source_billing = models.ForeignKey(
        Billing,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_delivery_receipts',
    )

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='delivery_receipts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.receipt_number} - {self.client_name}"


class DeliveryReceiptItem(models.Model):
    """Line items for delivery receipts."""

    delivery_receipt = models.ForeignKey(DeliveryReceipt, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=30, blank=True)
    remarks = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} - {self.delivery_receipt.receipt_number}"


class ScheduledDeliveryReceiptEmail(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    delivery_receipt = models.ForeignKey(DeliveryReceipt, on_delete=models.CASCADE, related_name='scheduled_emails')
    to_email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Scheduled delivery receipt email for {self.delivery_receipt.receipt_number} at {self.scheduled_at}"
