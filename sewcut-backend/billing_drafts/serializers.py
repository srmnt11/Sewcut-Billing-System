from rest_framework import serializers
from .models import Draft


class DraftSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Draft
        fields = [
            'id',
            'title',
            'type',
            'company_name',
            'draft_data',
            'grand_total',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        # created_by is set by perform_create in the ViewSet
        return super().create(validated_data)
