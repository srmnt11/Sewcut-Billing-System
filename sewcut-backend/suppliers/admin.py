from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'city', 'country', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'country']
    search_fields = ['name', 'email', 'contact_person']
    readonly_fields = ['created_at', 'updated_at']

