import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import fs from 'fs';
import path from 'path';
import { Billing } from '../../types/billing.types';
import { BillingService } from './billing.service';
import { emailConfig } from '../../config';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  attachmentPath: string;
  billingNumber?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

  /**
   * Initialize email transporter with configuration
   */
  private static getTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
    if (this.transporter) {
      return this.transporter;
    }

    // Email configuration from centralized config
    const config: EmailConfig = {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    };

    // Validate email configuration
    if (!config.auth.user || !config.auth.pass) {
      throw new Error(
        'Email configuration is incomplete. Please set SMTP_USER and SMTP_PASS environment variables.'
      );
    }

    this.transporter = nodemailer.createTransport(config);
    return this.transporter;
  }

  /**
   * Send email with PDF attachment
   * @param options - Email options
   * @returns Promise<boolean> - Success status
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = this.getTransporter();

      // Verify attachment file exists
      if (!fs.existsSync(options.attachmentPath)) {
        throw new Error(`Attachment file not found: ${options.attachmentPath}`);
      }

      // Prepare email
      const mailOptions = {
        from: `"${emailConfig.fromName}" <${emailConfig.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.body, // Body is already formatted HTML
        attachments: [
          {
            filename: path.basename(options.attachmentPath),
            path: options.attachmentPath,
            contentType: 'application/pdf'
          }
        ]
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', info.messageId);
      return true;

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send billing invoice email
   * @param billing - Billing data
   * @param recipientEmail - Recipient email address
   * @returns Promise<void>
   */
  static async sendBillingInvoice(
    billing: Billing,
    recipientEmail?: string
  ): Promise<void> {
    try {
      // Use provided email or billing contact email
      const toEmail = recipientEmail || this.extractEmailFromContact(billing);

      if (!toEmail) {
        throw new Error('No recipient email address provided or found in billing data');
      }

      // Verify PDF exists
      if (!billing.generatedFilePath) {
        throw new Error('Billing PDF has not been generated yet');
      }

      if (!fs.existsSync(billing.generatedFilePath)) {
        throw new Error('Billing PDF file not found');
      }

      // Update email status to pending
      await BillingService.update(billing._id!, {
        emailStatus: 'Pending'
      });

      // Prepare email content
      const subject = `Invoice ${billing.billingNumber} - ${billing.companyName}`;
      const body = this.generateBillingEmailBody(billing);

      // Send email
      const emailOptions: EmailOptions = {
        to: toEmail,
        subject,
        body,
        attachmentPath: billing.generatedFilePath,
        billingNumber: billing.billingNumber
      };

      await this.sendEmail(emailOptions);

      // Update billing record with email status
      await BillingService.update(billing._id!, {
        emailStatus: 'Sent',
        emailSentTo: toEmail,
        emailSentAt: new Date(),
        status: 'Emailed'
      });

      console.log(`Billing invoice sent successfully to ${toEmail}`);

    } catch (error) {
      console.error('Error sending billing invoice:', error);

      // Update email status to failed
      try {
        await BillingService.update(billing._id!, {
          emailStatus: 'Failed'
        });
      } catch (updateError) {
        console.error('Error updating email status to failed:', updateError);
      }

      throw error;
    }
  }

  /**
   * Generate HTML email body for billing invoice
   */
  private static generateBillingEmailBody(billing: Billing): string {
    const formattedDate = new Date(billing.billingDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedAmount = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(billing.grandTotal);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${billing.billingNumber}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; padding: 20px 15px;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 25px 20px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">
                      Sew Cut Wearing Apparel Manufacturing
                    </h1>
                    <p style="margin: 5px 0 0 0; color: #dbeafe; font-size: 13px;">Invoice ${billing.billingNumber}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 25px 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; color: #374151;">
                      Dear <strong>${billing.attentionPerson}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 18px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                      Thank you for your business. Please find attached your invoice for the services rendered.
                    </p>
                    
                    <!-- Invoice Details Card -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f0f9ff; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 18px;">
                      <tr>
                        <td style="padding: 16px;">
                          <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 15px; font-weight: 600; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">
                            📄 Invoice Details
                          </h2>
                          
                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                            <tr>
                              <td style="padding: 6px 0; color: #6b7280; font-size: 13px; font-weight: 500;">Invoice Number:</td>
                              <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600; text-align: right;">${billing.billingNumber}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e5e7eb;">
                              <td style="padding: 6px 0; color: #6b7280; font-size: 13px; font-weight: 500;">Date:</td>
                              <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600; text-align: right;">${formattedDate}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e5e7eb;">
                              <td style="padding: 6px 0; color: #6b7280; font-size: 13px; font-weight: 500;">Company:</td>
                              <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600; text-align: right;">${billing.companyName}</td>
                            </tr>
                            ${billing.deliveryReceiptNumber ? `
                            <tr style="border-top: 1px solid #e5e7eb;">
                              <td style="padding: 6px 0; color: #6b7280; font-size: 13px; font-weight: 500;">DR No:</td>
                              <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600; text-align: right;">${billing.deliveryReceiptNumber}</td>
                            </tr>
                            ` : ''}
                            <tr style="border-top: 2px solid #2563eb;">
                              <td style="padding: 10px 0 0 0; color: #111827; font-size: 14px; font-weight: 700;">Total Amount:</td>
                              <td style="padding: 10px 0 0 0; color: #2563eb; font-size: 20px; font-weight: 700; text-align: right;">${formattedAmount}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Payment Terms -->
                    <div style="padding: 14px; background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px; margin-bottom: 15px;">
                      <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                        <strong>⚠️ Payment Terms:</strong> Please make payment within <strong>30 days</strong>. The PDF contains complete details.
                      </p>
                    </div>
                    
                    <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                      For questions, please contact us at the email below.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 18px 20px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; color: #111827; font-size: 13px; font-weight: 600;">Best regards,</p>
                    <p style="margin: 0 0 6px 0; color: #111827; font-size: 14px; font-weight: 700;">Sew Cut Wearing Apparel Manufacturing</p>
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">
                      13 Delaware St. Barangay Banaba, San Mateo, Rizal 1850<br>
                      📧 <a href="mailto:sewcut.garmentsmanufacturing@gmail.com" style="color: #2563eb; text-decoration: none;">sewcut.garmentsmanufacturing@gmail.com</a>
                    </p>
                    <p style="margin: 12px 0 0 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af;">
                      <em>Automated notification from Sewcut Billing System. Do not reply to this email.</em>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private static extractEmailFromContact(billing: Billing): string | null {
    // Check if billing has client email
    if (billing.clientEmail) {
      return billing.clientEmail;
    }
    
    // Return null to force explicit email parameter
    return null;
  }

  /**
   * Test email configuration
   * Verifies SMTP connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      console.log('Email server connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email server connection test failed:', error);
      throw error;
    }
  }

  /**
   * Send test email
   * @param recipientEmail - Email to send test message to
   */
  static async sendTestEmail(recipientEmail: string): Promise<void> {
    try {
      const transporter = this.getTransporter();

      const mailOptions = {
        from: `"${emailConfig.fromName}" <${emailConfig.user}>`,
        to: recipientEmail,
        subject: 'Test Email - Sewcut Billing System',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Configuration Test</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                          ✅ Email Test Successful
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">
                          Sewcut Billing System Configuration
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <div style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #34d399 0%, #10b981 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <span style="color: #ffffff; font-size: 40px; font-weight: bold;">✓</span>
                          </div>
                        </div>
                        
                        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600; text-align: center;">
                          Email Configuration Verified
                        </h2>
                        
                        <p style="margin: 0 0 20px 0; font-size: 15px; color: #374151; line-height: 1.6; text-align: center;">
                          Congratulations! Your email configuration is working correctly.
                        </p>
                        
                        <div style="background: linear-gradient(to bottom right, #f0fdf4, #f3f4f6); padding: 25px; border-radius: 10px; border: 1px solid #d1fae5; margin: 25px 0;">
                          <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 1.6; text-align: center;">
                            <strong>✨ What does this mean?</strong><br><br>
                            Your Sewcut Billing System can now send invoice emails automatically. 
                            The system is ready to deliver professional invoices to your clients.
                          </p>
                        </div>
                        
                        <p style="margin: 25px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6; text-align: center;">
                          If you received this message, your SMTP configuration is properly set up 
                          and you can start sending invoices through the system.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 700;">
                          ${emailConfig.fromName}
                        </p>
                        <p style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af;">
                          <em>Automated test from Sewcut Billing System</em>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Test email sent successfully to:', recipientEmail);
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
}
