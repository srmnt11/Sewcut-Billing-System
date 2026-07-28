from rest_framework import serializers
from .models import Billing, BillingItem
from decimal import Decimal, ROUND_HALF_UP


def _round2(value):
    """Round a value to 2 decimal places using ROUND_HALF_UP"""
    try:
        return Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except (ValueError, TypeError):
        return Decimal('0.00')


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
                  'due_date', 'po_date', 'delivery_date', 'company_email', 'company_phone', 
                  'company_address', 'attention_person', 'subtotal', 'tax_rate', 'tax_amount', 
                  'discount', 'vat_inclusive', 'grand_total', 'notes', 'terms', 'status', 
                  'payment_type', 'source_quotation', 'items', 'created_at', 'updated_at']
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
            'poDate': data['po_date'],              
            'deliveryDate': data['delivery_date'], 
            'companyEmail': data['company_email'],
            'companyPhone': data['company_phone'],
            'companyAddress': data['company_address'],
            'attentionPerson': data['attention_person'],
            'subtotal': str(data['subtotal']),
            'taxRate': str(data['tax_rate']),
            'taxAmount': str(data['tax_amount']),
            'discount': str(data['discount']),
            'vatInclusive': data['vat_inclusive'],  # Add this line
            'grandTotal': str(data['grand_total']),
            'notes': data['notes'],
            'terms': data['terms'],
            'status': data['status'],
            'paymentType': data['payment_type'], 
            'sourceQuotationId': data.get('source_quotation'),
            'items': data.get('items', []),
            'createdAt': data['created_at'],
            'updatedAt': data['updated_at'],
        }

    def to_internal_value(self, data):
        # Round all monetary values to 2 decimal places
        subtotal = _round2(data.get('subtotal', 0))
        tax_amount = _round2(data.get('taxAmount', 0))
        grand_total = _round2(data.get('grandTotal', 0))
        
        internal = {
            'billing_number': data.get('billingNumber'),
            'client': data.get('client'),
            'company_name': data.get('companyName'),
            'billing_date': data.get('billingDate'),
            'due_date': data.get('dueDate') or None,
            'po_date': data.get('poDate') or None,       
            'delivery_date': data.get('deliveryDate') or None, 
            'company_email': data.get('companyEmail', ''),
            'company_phone': data.get('companyPhone', ''),
            'company_address': data.get('companyAddress', ''),
            'attention_person': data.get('attentionPerson', ''),
            'subtotal': subtotal,
            'tax_rate': data.get('taxRate', 0),
            'tax_amount': tax_amount,
            'discount': data.get('discount', 0),
            'vat_inclusive': data.get('vatInclusive', False),  # Add this line
            'grand_total': grand_total,
            'notes': data.get('notes', ''),
            'terms': data.get('terms', ''),
            'status': data.get('status', 'Draft'),
            'payment_type': data.get('paymentType', 'downpayment'),
            'source_quotation': data.get('sourceQuotationId'),
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
        new_status = validated_data.get('status', instance.status)
        payment_type = validated_data.get('payment_type', instance.payment_type)

        valid_statuses = {
            'downpayment': ['Pending', 'Sent', 'Partial Payment', 'Delivered', 'Paid', 'Cancelled'],
            'full': ['Pending', 'Sent', 'Paid', 'Delivered', 'Cancelled'],
        }
        if new_status not in valid_statuses.get(payment_type, []):
            raise serializers.ValidationError(
                {'status': f"'{new_status}' is not valid for payment type '{payment_type}'"}
            )

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