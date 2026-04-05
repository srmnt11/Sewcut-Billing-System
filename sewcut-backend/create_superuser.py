#!/usr/bin/env python
"""
Script to create an idempotent superuser for deployment.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewcut.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@sewcut.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
role = os.environ.get('DJANGO_SUPERUSER_ROLE', 'admin')
debug = os.environ.get('DEBUG', 'True').strip().lower() in {'1', 'true', 'yes', 'on'}
sync_credentials = os.environ.get('DJANGO_SUPERUSER_SYNC_CREDENTIALS', 'False').strip().lower() in {'1', 'true', 'yes', 'on'}

if not password and debug:
    # Local development fallback only.
    password = 'admin123'

if not password and not debug:
    print('Skipping superuser creation: DJANGO_SUPERUSER_PASSWORD is not set.')
    raise SystemExit(0)

user = User.objects.filter(username=username).first()

if not user:
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        role=role,
    )
    print('Superuser created successfully')
    print(f'Username: {username}')
    print(f'Email: {email}')
else:
    print('Superuser already exists')
    if sync_credentials and password:
        user.email = email
        user.role = role
        user.set_password(password)
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=['email', 'role', 'password', 'is_active', 'is_staff', 'is_superuser'])
        print('Superuser credentials synchronized from environment')
