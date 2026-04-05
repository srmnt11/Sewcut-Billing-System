from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from rest_framework.permissions import AllowAny
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
        invalid_credentials = serializers.ValidationError({
            'detail': 'Invalid username or password.'
        })

        try:
            username = (attrs.get('username') or '').strip()
            password = attrs.get('password') or ''

            if not username or not password:
                raise invalid_credentials

            # Accept case-insensitive usernames to reduce accidental login failures.
            candidate_user = User.objects.filter(username__iexact=username).first()
            if not candidate_user:
                raise invalid_credentials

            if not candidate_user.is_active:
                raise serializers.ValidationError({
                    'detail': 'This account has been deactivated. Please contact support.'
                })

            user = authenticate(
                request=self.context.get('request'),
                username=candidate_user.username,
                password=password,
            )
            if user is None:
                raise invalid_credentials

            refresh = self.get_token(user)
            return {
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
        except serializers.ValidationError:
            raise
        except Exception:
            logger.exception('Unexpected authentication backend failure during login')
            raise serializers.ValidationError({
                'detail': 'Authentication temporarily unavailable. Please try again.'
            })


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with enhanced validation"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'
