from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Draft(models.Model):
    """Draft model for storing incomplete invoices and quotations"""
    TYPE_CHOICES = [
        ('invoice', 'Invoice'),
        ('quotation', 'Quotation'),
    ]

    # Basic Info
    title = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    company_name = models.CharField(max_length=255, blank=True)
    
    # Draft Data (stored as JSON)
    draft_data = models.JSONField(default=dict)
    
    # Totals (for quick display)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='drafts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.get_type_display()} Draft - {self.title or 'Untitled'}"
