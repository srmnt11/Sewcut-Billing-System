from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/suppliers/', include('suppliers.urls')),
    path('api/quotations/', include('quotations.urls')),
    path('api/billings/', include('billings.urls')),
    path('api/delivery-receipts/', include('delivery_receipts.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/drafts/', include('billing_drafts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)