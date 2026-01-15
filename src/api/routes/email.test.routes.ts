/**
 * Email Test Routes
 * Routes for testing email configuration
 */

import { Router, Request, Response } from 'express';
import { EmailService } from '../services/email.service';

const router = Router();

/**
 * @route   POST /api/test-connection
 * @desc    Test SMTP server connection
 * @access  Public (should be protected in production)
 */
router.post('/test-connection', async (_req: Request, res: Response) => {
  try {
    await EmailService.testConnection();
    
    return res.status(200).json({
      success: true,
      message: 'Email server connection verified successfully'
    });
  } catch (error) {
    console.error('Email connection test failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Email server connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/test-email
 * @desc    Send a test email
 * @access  Public (should be protected in production)
 * @body    { recipientEmail: string }
 */
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }

    await EmailService.sendTestEmail(recipientEmail);
    
    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`
    });
  } catch (error) {
    console.error('Test email sending failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
