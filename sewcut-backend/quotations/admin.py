from django.contrib import admin
from .models import Quotation, QuotationItem


class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 1


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ['quotation_number', 'company_name', 'quotation_date', 'grand_total', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'quotation_date']
    search_fields = ['quotation_number', 'company_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [QuotationItemInline]

