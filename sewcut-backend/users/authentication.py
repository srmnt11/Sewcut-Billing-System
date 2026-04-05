from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework.throttling import ScopedRateThrottle
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with enhanced validation"""
    
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username', '').strip()
        password = attrs.get('password', '')

        # Validate username is not empty
        if not username:
            raise serializers.ValidationError({
                'username': 'Username is required.'
            })

        # Validate password is not empty
        if not password:
            raise serializers.ValidationError({
                'password': 'Password is required.'
            })

        # Use a generic response to prevent username enumeration attacks.
        invalid_credentials = serializers.ValidationError({
            'detail': 'Invalid username or password.'
        })

        # Check if user exists
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise invalid_credentials

        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError({
                'detail': 'This account has been deactivated. Please contact support.'
            })

        # Authenticate user
        try:
            user = authenticate(username=username, password=password)
        except Exception:
            logger.exception('Unexpected authentication backend failure during login')
            raise serializers.ValidationError({
                'detail': 'Authentication temporarily unavailable. Please try again.'
            })

        if user is None:
            raise invalid_credentials

        # Get token data
        refresh = self.get_token(user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'role': user.role,
            }
        }

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with enhanced validation"""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'
