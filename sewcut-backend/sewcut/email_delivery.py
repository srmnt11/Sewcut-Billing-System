import base64
import logging
import os

import requests
from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)


def send_email_with_pdf_attachment(subject, message, to_email, filename, file_bytes):
    """Send an email with a PDF attachment.

    Delivery strategy:
    1) If RESEND_API_KEY and RESEND_FROM_EMAIL are configured, send via Resend HTTPS API.
    2) Otherwise, fall back to Django SMTP backend.
    """
    resend_api_key = os.environ.get('RESEND_API_KEY', '').strip()
    resend_from_email = os.environ.get('RESEND_FROM_EMAIL', '').strip()
    timeout = int(getattr(settings, 'EMAIL_TIMEOUT', 20))

    if resend_api_key and resend_from_email:
        payload = {
            'from': resend_from_email,
            'to': [to_email],
            'subject': subject,
            'text': message or '',
            'attachments': [
                {
                    'filename': filename,
                    'content': base64.b64encode(file_bytes).decode('ascii'),
                }
            ],
        }
        headers = {
            'Authorization': f'Bearer {resend_api_key}',
            'Content-Type': 'application/json',
        }

        response = requests.post(
            'https://api.resend.com/emails',
            headers=headers,
            json=payload,
            timeout=timeout,
        )
        if 200 <= response.status_code < 300:
            logger.info('Email delivered via Resend API to %s', to_email)
            return

        raise RuntimeError(
            f'Resend API failed ({response.status_code}): {response.text[:300]}'
        )

    try:
        email = EmailMessage(
            subject=subject,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        email.attach(filename, file_bytes, 'application/pdf')
        email.send(fail_silently=False)
        logger.info('Email delivered via SMTP to %s', to_email)
    except OSError as exc:
        if getattr(exc, 'errno', None) == 101:
            raise RuntimeError(
                'SMTP network unreachable from Render. Configure RESEND_API_KEY and '
                'RESEND_FROM_EMAIL to send email over HTTPS.'
            ) from exc
        raise
