from pathlib import Path
import os
import urllib.parse

from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def env_bool(name, default=False):
    """Parse boolean environment variables safely."""
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {'1', 'true', 'yes', 'on'}


def env_csv(name, default=''):
    """Parse comma-separated environment variables into a clean list."""
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(',') if item.strip()]


def env_str(name, default=''):
    """Read string environment variables and treat empty values as missing."""
    raw = os.environ.get(name)
    if raw is None:
        return default
    value = raw.strip()
    return value if value else default


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY: read sensitive settings from environment when available
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-t3#%grsz7&cbslls-79q+h-3-i2cg(q^3r@&v^%4ob)72%&%d#')

# DEBUG should be False in production. Set environment var to 'True' to enable.
DEBUG = env_bool('DEBUG', True)

# ALLOWED_HOSTS can be provided as a comma-separated env var
ALLOWED_HOSTS = env_csv('ALLOWED_HOSTS', 'localhost,127.0.0.1')

# Render exposes the public hostname as RENDER_EXTERNAL_HOSTNAME.
render_external_hostname = os.environ.get('RENDER_EXTERNAL_HOSTNAME', '').strip()
if render_external_hostname and render_external_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_external_hostname)


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'users',
    'billings',
    'clients',
    'quotations',
    'suppliers',
    'analytics',
    'billing_drafts',
    'delivery_receipts',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'sewcut.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'sewcut.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

# Database configuration: prefer DATABASE_URL env var (Render provides one)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    url = urllib.parse.urlparse(DATABASE_URL)
    if url.scheme.startswith('postgres') or url.scheme.startswith('postgresql'):
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': url.path[1:],
                'USER': url.username,
                'PASSWORD': url.password,
                'HOST': url.hostname,
                'PORT': url.port or '',
            }
        }
    else:
        # Fallback: if other schemes are provided, you can extend parsing here
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    # Default to local SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        },
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (user-uploaded content: quotation reference photos, etc.)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/6.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# CORS Settings
# If CORS_ALLOWED_ORIGINS is provided as a comma-separated env var, use it;
# otherwise fall back to allowing all origins (safer to set explicit origins in prod).
cors_env = os.environ.get('CORS_ALLOWED_ORIGINS')
if cors_env:
    CORS_ALLOWED_ORIGINS = env_csv('CORS_ALLOWED_ORIGINS')
    CORS_ALLOW_ALL_ORIGINS = False
else:
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = env_bool('CORS_ALLOW_CREDENTIALS', True)

# Needed for secure admin/login flows behind HTTPS proxies.
CSRF_TRUSTED_ORIGINS = env_csv('CSRF_TRUSTED_ORIGINS')

# REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
    'DEFAULT_THROTTLE_RATES': {
        'anon': env_str('THROTTLE_ANON_RATE', '100/hour'),
        'user': env_str('THROTTLE_USER_RATE', '1000/hour'),
        'login': env_str('THROTTLE_LOGIN_RATE', '10/minute'),
    },
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# Use PBKDF2 by default; allow opting into Argon2 with USE_ARGON2_HASHER=True.
if env_bool('USE_ARGON2_HASHER', False):
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.Argon2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
        'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    ]
else:
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.PBKDF2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
        'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    ]

# Disable public user registration in production by default.
ENABLE_PUBLIC_REGISTRATION = env_bool('ENABLE_PUBLIC_REGISTRATION', DEBUG)

# Email Settings - read from environment in production
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', True)
EMAIL_TIMEOUT = int(os.environ.get('EMAIL_TIMEOUT', 20))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# Celery Settings - default to a local filesystem broker for Windows development.
celery_broker_dir = BASE_DIR / 'celerybroker'
celery_broker_out = celery_broker_dir / 'out'
celery_broker_in = celery_broker_out
celery_broker_processed = celery_broker_dir / 'processed'
for path in (celery_broker_dir, celery_broker_in, celery_broker_out, celery_broker_processed):
    os.makedirs(path, exist_ok=True)

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'filesystem://')
CELERY_BROKER_TRANSPORT_OPTIONS = {
    'data_folder_in': str(celery_broker_in),
    'data_folder_out': str(celery_broker_out),
    'data_folder_processed': str(celery_broker_processed),
}
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND') or None
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = USE_TZ
CELERY_BEAT_SCHEDULE = {
    'send-due-scheduled-emails-every-minute': {
        'task': 'billings.tasks.send_due_scheduled_emails',
        'schedule': 60.0,
    },
    'send-due-scheduled-quotation-emails-every-minute': {
        'task': 'quotations.tasks.send_due_scheduled_quotation_emails',
        'schedule': 60.0,
    },
    'send-due-scheduled-delivery-receipt-emails-every-minute': {
        'task': 'delivery_receipts.tasks.send_due_scheduled_delivery_receipt_emails',
        'schedule': 60.0,
    },
}

# For testing/development you can set EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = env_bool('SECURE_SSL_REDIRECT', True)
    SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', 31536000))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', True)
    SECURE_HSTS_PRELOAD = env_bool('SECURE_HSTS_PRELOAD', True)

