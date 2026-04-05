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
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
role = os.environ.get('DJANGO_SUPERUSER_ROLE', 'admin')

if not User.objects.filter(username=username).exists():
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
