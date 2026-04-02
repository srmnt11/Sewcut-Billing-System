from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'email', 'phone', 'address', 'city', 'country', 
                  'contact_person', 'notes', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        """Convert to camelCase for frontend compatibility"""
        data = super().to_representation(instance)
        return {
            'id': data['id'],
            'name': data['name'],
            'email': data['email'],
            'phone': data['phone'],
            'address': data['address'],
            'city': data['city'],
            'country': data['country'],
            'contactPerson': data['contact_person'],
            'notes': data['notes'],
            'status': data['status'],
            'createdAt': data['created_at'],
            'updatedAt': data['updated_at'],
        }

    def to_internal_value(self, data):
        """Convert from camelCase to snake_case"""
        internal = {
            'name': data.get('name'),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'address': data.get('address', ''),
            'city': data.get('city', ''),
            'country': data.get('country', ''),
            'contact_person': data.get('contactPerson', ''),
            'notes': data.get('notes', ''),
            'status': data.get('status', 'active'),
        }
        return super().to_internal_value(internal)
