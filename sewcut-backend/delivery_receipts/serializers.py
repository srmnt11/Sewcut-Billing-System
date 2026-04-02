from rest_framework import serializers
from .models import DeliveryReceipt, DeliveryReceiptItem


class DeliveryReceiptItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryReceiptItem
        fields = ['id', 'description', 'quantity', 'unit', 'remarks']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            'id': data['id'],
            'description': data['description'],
            'quantity': str(data['quantity']),
            'unit': data['unit'],
            'remarks': data['remarks'],
        }

    def to_internal_value(self, data):
        internal = {
            'description': data.get('description'),
            'quantity': data.get('quantity', 1),
            'unit': data.get('unit', ''),
            'remarks': data.get('remarks', ''),
        }
        return super().to_internal_value(internal)


class DeliveryReceiptSerializer(serializers.ModelSerializer):
    items = DeliveryReceiptItemSerializer(many=True, required=False)

    class Meta:
        model = DeliveryReceipt
        fields = [
            'id',
            'receipt_number',
            'client',
            'client_name',
            'delivery_date',
            'address',
            'contact_person',
            'reference_number',
            'notes',
            'status',
            'source_billing',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            'id': data['id'],
            'receiptNumber': data['receipt_number'],
            'client': data['client'],
            'clientName': data['client_name'],
            'deliveryDate': data['delivery_date'],
            'address': data['address'],
            'contactPerson': data['contact_person'],
            'referenceNumber': data['reference_number'],
            'notes': data['notes'],
            'status': data['status'],
            'sourceBillingId': data.get('source_billing'),
            'items': data.get('items', []),
            'createdAt': data['created_at'],
            'updatedAt': data['updated_at'],
        }

    def to_internal_value(self, data):
        internal = {
            'receipt_number': data.get('receiptNumber'),
            'client': data.get('client'),
            'client_name': data.get('clientName'),
            'delivery_date': data.get('deliveryDate'),
            'address': data.get('address', ''),
            'contact_person': data.get('contactPerson', ''),
            'reference_number': data.get('referenceNumber', ''),
            'notes': data.get('notes', ''),
            'status': data.get('status', 'Draft'),
            'source_billing': data.get('sourceBillingId'),
        }
        if 'items' in data:
            internal['items'] = data['items']
        return super().to_internal_value(internal)

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        delivery_receipt = DeliveryReceipt.objects.create(**validated_data)

        for item_data in items_data:
            DeliveryReceiptItem.objects.create(delivery_receipt=delivery_receipt, **item_data)

        return delivery_receipt

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                DeliveryReceiptItem.objects.create(delivery_receipt=instance, **item_data)

        return instance
