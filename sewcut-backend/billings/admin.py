from django.contrib import admin
from .models import Billing, BillingItem


class BillingItemInline(admin.TabularInline):
    model = BillingItem
    extra = 1


@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    list_display = ['billing_number', 'company_name', 'billing_date', 'grand_total', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'billing_date']
    search_fields = ['billing_number', 'company_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [BillingItemInline]

