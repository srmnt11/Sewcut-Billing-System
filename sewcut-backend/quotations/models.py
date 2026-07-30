from django.db import models
from django.contrib.auth import get_user_model
from clients.models import Client

User = get_user_model()


class Quotation(models.Model):
    """Quotation model for managing quotes"""
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Pending', 'Pending'),
        ('Sent', 'Sent'),
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
    ]

    quotation_number = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='quotations', null=True, blank=True)
    company_name = models.CharField(max_length=255)
    quotation_date = models.DateField()
    valid_until = models.DateField(null=True, blank=True)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')

    # Cover Letter fields
    cover_letter_recipient = models.CharField(max_length=255, blank=True)
    cover_letter_recipient_title = models.CharField(max_length=255, blank=True)
    cover_letter_company = models.CharField(max_length=255, blank=True)
    cover_letter_address = models.TextField(blank=True)
    cover_letter_body = models.TextField(blank=True)

    # NEW: reference photo for the quoted item(s), shown in the description box of the PDF
    reference_image = models.ImageField(upload_to='quotations/reference_images/', null=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='quotations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.quotation_number} - {self.company_name}"

    def calculate_totals(self):
        """Calculate all totals based on line items"""
        self.subtotal = sum(item.total for item in self.items.all())
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        self.grand_total = self.subtotal + self.tax_amount - self.discount
        self.save()


class QuotationItem(models.Model):
    """Line items for quotations"""
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # NEW: optional per-item photo (e.g. a specific fabric design/colorway)
    image = models.ImageField(upload_to='quotations/item_images/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - {self.quotation.quotation_number}"


class ScheduledQuotationEmail(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='scheduled_emails')
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
        return f"Scheduled quotation email for {self.quotation.quotation_number} at {self.scheduled_at}"