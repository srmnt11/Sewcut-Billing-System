from django.urls import path, include
from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, UserViewSet, current_user
from .authentication import CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', current_user, name='current_user'),
    path('', include(router.urls)),
]

if settings.ENABLE_PUBLIC_REGISTRATION:
    urlpatterns.insert(0, path('register/', RegisterView.as_view(), name='register'))
