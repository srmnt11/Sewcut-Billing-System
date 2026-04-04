#!/usr/bin/env python3
"""Small helper to print a Django SECRET_KEY for production use.

Usage:
  python scripts/generate_secret.py
"""
from django.core.management.utils import get_random_secret_key

def main():
    print(get_random_secret_key())

if __name__ == '__main__':
    main()
