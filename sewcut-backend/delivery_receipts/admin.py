from django.contrib import admin
from .models import DeliveryReceipt, DeliveryReceiptItem


class DeliveryReceiptItemInline(admin.TabularInline):
    model = DeliveryReceiptItem
    extra = 1


@admin.register(DeliveryReceipt)
class DeliveryReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'client_name', 'delivery_date', 'status', 'created_at')
    list_filter = ('status', 'delivery_date', 'created_at')
    search_fields = ('receipt_number', 'client_name', 'reference_number')
    inlines = [DeliveryReceiptItemInline]
