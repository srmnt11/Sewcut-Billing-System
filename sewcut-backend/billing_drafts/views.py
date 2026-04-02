from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Draft
from .serializers import DraftSerializer


class DraftViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing drafts (incomplete invoices and quotations).
    """
    serializer_class = DraftSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own drafts
        return Draft.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
