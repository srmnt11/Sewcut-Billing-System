#!/usr/bin/env python
"""
Script to create a default superuser for testing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewcut.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@sewcut.com',
        password='admin123',
        role='admin'
    )
    print('✓ Superuser created successfully!')
    print('  Username: admin')
    print('  Password: admin123')
    print('  Email: admin@sewcut.com')
else:
    print('✓ Superuser already exists')
