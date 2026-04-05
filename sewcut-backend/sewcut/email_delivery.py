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
    1) If SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are configured, send via SendGrid HTTPS API.
    2) Else if RESEND_API_KEY and RESEND_FROM_EMAIL are configured, send via Resend HTTPS API.
    3) Otherwise, fall back to Django SMTP backend.
    """
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY', '').strip()
    sendgrid_from_email = os.environ.get('SENDGRID_FROM_EMAIL', '').strip()
    resend_api_key = os.environ.get('RESEND_API_KEY', '').strip()
    resend_from_email = os.environ.get('RESEND_FROM_EMAIL', '').strip()
    timeout = int(getattr(settings, 'EMAIL_TIMEOUT', 20))

    if sendgrid_api_key and sendgrid_from_email:
        payload = {
            'personalizations': [
                {
                    'to': [{'email': to_email}],
                    'subject': subject,
                }
            ],
            'from': {'email': sendgrid_from_email},
            'content': [
                {
                    'type': 'text/plain',
                    'value': message or '',
                }
            ],
            'attachments': [
                {
                    'content': base64.b64encode(file_bytes).decode('ascii'),
                    'filename': filename,
                    'type': 'application/pdf',
                    'disposition': 'attachment',
                }
            ],
        }
        headers = {
            'Authorization': f'Bearer {sendgrid_api_key}',
            'Content-Type': 'application/json',
        }

        response = requests.post(
            'https://api.sendgrid.com/v3/mail/send',
            headers=headers,
            json=payload,
            timeout=timeout,
        )

        if 200 <= response.status_code < 300:
            logger.info('Email delivered via SendGrid API to %s', to_email)
            return {
                'provider': 'sendgrid',
                'delivered_to': to_email,
                'redirected': False,
            }

        raise RuntimeError(
            f'SendGrid API failed ({response.status_code}): {response.text[:300]}'
        )

    if resend_api_key and resend_from_email:
        test_recipient = os.environ.get('RESEND_TEST_RECIPIENT_EMAIL', '').strip()
        delivered_to = to_email
        redirected = False

        # Resend's default testing sender only allows sending to your own account email.
        if resend_from_email.endswith('@resend.dev') and test_recipient and to_email != test_recipient:
            delivered_to = test_recipient
            redirected = True

        payload = {
            'from': resend_from_email,
            'to': [delivered_to],
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
            logger.info('Email delivered via Resend API to %s', delivered_to)
            return {
                'provider': 'resend',
                'delivered_to': delivered_to,
                'redirected': redirected,
            }

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
        return {
            'provider': 'smtp',
            'delivered_to': to_email,
            'redirected': False,
        }
    except OSError as exc:
        if getattr(exc, 'errno', None) == 101:
            raise RuntimeError(
                'SMTP network unreachable from Render. Configure SENDGRID_API_KEY + '
                'SENDGRID_FROM_EMAIL or RESEND_API_KEY + RESEND_FROM_EMAIL to send '
                'email over HTTPS.'
            ) from exc
        raise
