from django.contrib import admin
from .models import Draft


@admin.register(Draft)
class DraftAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'company_name', 'grand_total', 'created_by', 'updated_at')
    list_filter = ('type', 'created_at', 'updated_at')
    search_fields = ('title', 'company_name')
    readonly_fields = ('created_at', 'updated_at')
