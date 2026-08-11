from rest_framework import serializers
from .models import Quotation, QuotationItem
from django.core.files.uploadedfile import UploadedFile
import json

class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total', 'image']
        read_only_fields = ['total']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        image_url = None
        if instance.image:
            image_url = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        return {
            'id': data['id'],
            'description': data['description'],
            'quantity': str(data['quantity']),
            'unitPrice': str(data['unit_price']),
            'total': str(data['total']),
            'image': image_url,
        }

    def to_internal_value(self, data):
        internal = {
            'description': data.get('description'),
            'quantity': data.get('quantity'),
            'unit_price': data.get('unitPrice'),
        }
        return super().to_internal_value(internal)


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, required=False)

    class Meta:
        model = Quotation
        fields = ['id', 'quotation_number', 'client', 'company_name', 'quotation_date',
                  'valid_until', 'subtotal', 'tax_rate', 'tax_amount', 'discount',
                  'grand_total', 'notes', 'terms', 'status',
                  'cover_letter_recipient', 'cover_letter_recipient_title',
                  'cover_letter_company', 'cover_letter_address', 'cover_letter_body',
                  'creator_name', 'creator_signature',
                  'reference_image', 'items', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        reference_image_url = None
        if instance.reference_image:
            reference_image_url = request.build_absolute_uri(instance.reference_image.url) if request else instance.reference_image.url
        creator_signature_url = None
        if instance.creator_signature:
            creator_signature_url = request.build_absolute_uri(instance.creator_signature.url) if request else instance.creator_signature.url
        return {
            'id': data['id'],
            'quotationNumber': data['quotation_number'],
            'client': data['client'],
            'companyName': data['company_name'],
            'quotationDate': data['quotation_date'],
            'validUntil': data['valid_until'],
            'subtotal': str(data['subtotal']),
            'taxRate': str(data['tax_rate']),
            'taxAmount': str(data['tax_amount']),
            'discount': str(data['discount']),
            'grandTotal': str(data['grand_total']),
            'notes': data['notes'],
            'terms': data['terms'],
            'status': data['status'],
            'coverLetterRecipient': data.get('cover_letter_recipient', ''),
            'coverLetterRecipientTitle': data.get('cover_letter_recipient_title', ''),
            'coverLetterCompany': data.get('cover_letter_company', ''),
            'coverLetterAddress': data.get('cover_letter_address', ''),
            'coverLetterBody': data.get('cover_letter_body', ''),
            'creatorName': data.get('creator_name', ''),
            'creatorSignature': creator_signature_url,
            'referenceImage': reference_image_url,
            'items': data.get('items', []),
            'createdAt': data['created_at'],
            'updatedAt': data['updated_at'],
        }

    def to_internal_value(self, data):
        internal = {}

        field_map = {
            'quotationNumber': 'quotation_number',
            'client': 'client',
            'companyName': 'company_name',
            'quotationDate': 'quotation_date',
            'validUntil': 'valid_until',
            'subtotal': 'subtotal',
            'taxRate': 'tax_rate',
            'taxAmount': 'tax_amount',
            'discount': 'discount',
            'grandTotal': 'grand_total',
            'notes': 'notes',
            'terms': 'terms',
            'status': 'status',
            'coverLetterRecipient': 'cover_letter_recipient',
            'coverLetterRecipientTitle': 'cover_letter_recipient_title',
            'coverLetterCompany': 'cover_letter_company',
            'coverLetterAddress': 'cover_letter_address',
            'coverLetterBody': 'cover_letter_body',
        }
        for incoming_key, model_key in field_map.items():
            if incoming_key in data:
                internal[model_key] = data.get(incoming_key)

        if 'creatorName' in data:
            internal['creator_name'] = data.get('creatorName', '')
        # Only touch reference_image/creator_signature if the key was actually sent —
        # otherwise a JSON-only update would wipe out the existing image.
        if 'creatorSignature' in data:
            sig_val = data.get('creatorSignature')
            if isinstance(sig_val, UploadedFile):
                internal['creator_signature'] = sig_val
            # else: a URL string echoed back — not a new upload, leave untouched.
        if 'referenceImage' in data:
            ref_val = data.get('referenceImage')
            if isinstance(ref_val, UploadedFile):
                internal['reference_image'] = ref_val
            elif ref_val in ('', None, 'null'):
                internal['reference_image'] = None
            # else: a URL string — leave the existing reference image alone.
        if 'items' in data:
            raw_items = data['items']
            if isinstance(raw_items, str):
                try:
                    raw_items = json.loads(raw_items)
                except (ValueError, TypeError):
                    raw_items = []
            internal['items'] = raw_items

        return super().to_internal_value(internal)

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        quotation = Quotation.objects.create(**validated_data)

        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)

        quotation.calculate_totals()
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(quotation=instance, **item_data)
            instance.calculate_totals()

        return instance