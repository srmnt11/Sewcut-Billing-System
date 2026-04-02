from rest_framework import serializers
from .models import Billing, BillingItem


class BillingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total']
        read_only_fields = ['total']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            'id': data['id'],
            'description': data['description'],
            'quantity': str(data['quantity']),
            'unitPrice': str(data['unit_price']),
            'total': str(data['total']),
        }

    def to_internal_value(self, data):
        internal = {
            'description': data.get('description'),
            'quantity': data.get('quantity'),
            'unit_price': data.get('unitPrice'),
        }
        return super().to_internal_value(internal)


class BillingSerializer(serializers.ModelSerializer):
    items = BillingItemSerializer(many=True, required=False)

    class Meta:
        model = Billing
        fields = ['id', 'billing_number', 'client', 'company_name', 'billing_date', 
                  'due_date', 'company_email', 'company_phone', 'company_address',
                  'subtotal', 'tax_rate', 'tax_amount', 'discount', 'grand_total', 
                  'notes', 'terms', 'status', 'items', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            'id': data['id'],
            'billingNumber': data['billing_number'],
            'client': data['client'],
            'companyName': data['company_name'],
            'billingDate': data['billing_date'],
            'dueDate': data['due_date'],
            'companyEmail': data['company_email'],
            'companyPhone': data['company_phone'],
            'companyAddress': data['company_address'],
            'subtotal': str(data['subtotal']),
            'taxRate': str(data['tax_rate']),
            'taxAmount': str(data['tax_amount']),
            'discount': str(data['discount']),
            'grandTotal': str(data['grand_total']),
            'notes': data['notes'],
            'terms': data['terms'],
            'status': data['status'],
            'items': data.get('items', []),
            'createdAt': data['created_at'],
            'updatedAt': data['updated_at'],
        }

    def to_internal_value(self, data):
        internal = {
            'billing_number': data.get('billingNumber'),
            'client': data.get('client'),
            'company_name': data.get('companyName'),
            'billing_date': data.get('billingDate'),
            'due_date': data.get('dueDate'),
            'company_email': data.get('companyEmail', ''),
            'company_phone': data.get('companyPhone', ''),
            'company_address': data.get('companyAddress', ''),
            'subtotal': data.get('subtotal', 0),
            'tax_rate': data.get('taxRate', 0),
            'tax_amount': data.get('taxAmount', 0),
            'discount': data.get('discount', 0),
            'grand_total': data.get('grandTotal', 0),
            'notes': data.get('notes', ''),
            'terms': data.get('terms', ''),
            'status': data.get('status', 'Draft'),
        }
        if 'items' in data:
            internal['items'] = data['items']
        return super().to_internal_value(internal)

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        billing = Billing.objects.create(**validated_data)
        
        for item_data in items_data:
            BillingItem.objects.create(billing=billing, **item_data)
        
        billing.calculate_totals()
        return billing

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                BillingItem.objects.create(billing=instance, **item_data)
            instance.calculate_totals()
        
        return instance
