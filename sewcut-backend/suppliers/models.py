from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Supplier(models.Model):
    """Supplier model for managing vendor information"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    CATEGORY_CHOICES = [
        ('fabric', 'Fabric'),
        ('accessories', 'Accessories'),
        ('packaging', 'Packaging'),
        ('equipment', 'Equipment'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='suppliers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

