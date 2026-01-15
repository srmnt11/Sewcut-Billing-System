/**
 * Billing Controller
 * Handles HTTP requests for billing operations
 */

import { Request, Response } from 'express';
import { 
  Billing, 
  CreateBillingDTO, 
  BillingItem,
  calculateLineTotal,
  calculateSubtotal,
  calculateGrandTotal 
} from '../../types/billing.types';
import { 
  validateCompanyName,
  validateAddress,
  validateContactNumber,
  validateAttentionPerson,
  validateBillingDate,
  validateBillingItems,
  validateDiscount
} from '../../lib/validation';
import { generateBillingNumber } from '../../lib/utils';
import { BillingService } from '../services/billing.service';
import { PdfGenerationService } from '../services/pdf.generation.service';
import { EmailService } from '../services/email.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/User.model.js';

/**
 * Create a new billing record
 * POST /api/billings
 */
export async function createBilling(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const billingData: CreateBillingDTO = req.body;

    // Ensure user is authenticated
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate required fields
    const validationErrors: string[] = [];

    // Validate company name
    const companyNameValidation = validateCompanyName(billingData.companyName);
    if (!companyNameValidation.isValid) {
      validationErrors.push(companyNameValidation.error!);
    }

    // Validate address
    const addressValidation = validateAddress(billingData.address);
    if (!addressValidation.isValid) {
      validationErrors.push(addressValidation.error!);
    }

    // Validate contact number
    const contactValidation = validateContactNumber(billingData.contactNumber);
    if (!contactValidation.isValid) {
      validationErrors.push(contactValidation.error!);
    }

    // Validate attention person
    const attentionValidation = validateAttentionPerson(billingData.attentionPerson);
    if (!attentionValidation.isValid) {
      validationErrors.push(attentionValidation.error!);
    }

    // Validate billing date
    const dateValidation = validateBillingDate(billingData.billingDate);
    if (!dateValidation.isValid) {
      validationErrors.push(dateValidation.error!);
    }

    // Validate items
    if (!billingData.items || !Array.isArray(billingData.items)) {
      validationErrors.push('Items must be an array');
    } else {
      const itemsValidation = validateBillingItems(billingData.items);
      if (!itemsValidation.isValid) {
        validationErrors.push(itemsValidation.error!);
      }

      // Validate each item
      billingData.items.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          validationErrors.push(`Item ${index + 1}: Description is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          validationErrors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (item.unitPrice === undefined || item.unitPrice < 0) {
          validationErrors.push(`Item ${index + 1}: Unit price cannot be negative`);
        }
      });
    }

    // If there are validation errors, return 400 Bad Request
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Calculate line totals for each item
    const itemsWithLineTotals: BillingItem[] = billingData.items.map(item => ({
      ...item,
      id: item.id || Math.random().toString(36).substr(2, 9),
      lineTotal: calculateLineTotal(item.quantity, item.unitPrice)
    }));

    // Calculate financial totals
    const subtotal = calculateSubtotal(itemsWithLineTotals);
    const discount = billingData.discount || 0;

    // Validate discount
    const discountValidation = validateDiscount(discount, subtotal);
    if (!discountValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [discountValidation.error!]
      });
    }

    const grandTotal = calculateGrandTotal(subtotal, discount);

    // Generate unique billing number
    const billingNumber = generateBillingNumber();

    // Create billing document
    const newBilling: Omit<Billing, '_id'> = {
      billingNumber,
      billingDate: new Date(billingData.billingDate),
      deliveryReceiptNumber: billingData.deliveryReceiptNumber,
      companyName: billingData.companyName.trim(),
      address: billingData.address.trim(),
      contactNumber: billingData.contactNumber.trim(),
      attentionPerson: billingData.attentionPerson.trim(),
      clientEmail: billingData.clientEmail?.trim(),
      items: itemsWithLineTotals,
      subtotal,
      discount,
      grandTotal,
      status: 'Draft',
      emailStatus: 'Not Sent',
      createdBy: req.user!.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    const savedBilling = await BillingService.create(newBilling);

    // Track the final billing state
    let finalBilling = savedBilling;
    let pdfGenerated = false;
    let emailSent = false;
    const pipelineErrors: string[] = [];

    // Step 1: Generate PDF invoice
    try {
      console.log(`[Pipeline] Generating PDF for billing ${savedBilling.billingNumber}...`);
      const pdfPath = await PdfGenerationService.generateInvoice(savedBilling);
      
      // Update billing with PDF path and change status to 'Generated'
      const updatedBilling = await BillingService.update(savedBilling._id!, {
        generatedFilePath: pdfPath,
        status: 'Generated'
      });

      if (updatedBilling) {
        finalBilling = updatedBilling;
        pdfGenerated = true;
        console.log(`[Pipeline] ✅ PDF generated successfully: ${pdfPath}`);
      } else {
        // Manually update the object if service doesn't return updated billing
        finalBilling.generatedFilePath = pdfPath;
        finalBilling.status = 'Generated';
        pdfGenerated = true;
        console.log(`[Pipeline] ✅ PDF generated successfully: ${pdfPath}`);
      }
    } catch (pdfError) {
      const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown PDF error';
      pipelineErrors.push(`PDF generation failed: ${errorMessage}`);
      console.error('[Pipeline] ❌ PDF generation failed:', pdfError);
      // Continue to next step - PDF failure shouldn't stop the process
    }

    // Step 2: Send email (only if PDF was generated and recipient email provided)
    if (pdfGenerated && (billingData.clientEmail || req.body.recipientEmail)) {
      const recipientEmail = billingData.clientEmail || req.body.recipientEmail;
      
      try {
        console.log(`[Pipeline] Sending email to ${recipientEmail}...`);
        await EmailService.sendBillingInvoice(finalBilling, recipientEmail);
        
        // The EmailService automatically updates the billing status
        // Fetch the updated billing to get the latest state
        const emailedBilling = await BillingService.findById(finalBilling._id!);
        if (emailedBilling) {
          finalBilling = emailedBilling;
          emailSent = true;
          console.log(`[Pipeline] ✅ Email sent successfully to ${recipientEmail}`);
        } else {
          // Manually update for response if fetch fails
          finalBilling.emailStatus = 'Sent';
          finalBilling.emailSentTo = recipientEmail;
          finalBilling.emailSentAt = new Date();
          finalBilling.status = 'Emailed';
          emailSent = true;
          console.log(`[Pipeline] ✅ Email sent successfully to ${recipientEmail}`);
        }
      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown email error';
        pipelineErrors.push(`Email sending failed: ${errorMessage}`);
        console.error('[Pipeline] ❌ Email sending failed:', emailError);
        
        // Update email status to failed (this won't throw)
        try {
          await BillingService.update(finalBilling._id!, {
            emailStatus: 'Failed'
          });
          finalBilling.emailStatus = 'Failed';
        } catch (updateError) {
          console.error('[Pipeline] Failed to update email status to Failed:', updateError);
        }
      }
    } else if (pdfGenerated && !billingData.clientEmail && !req.body.recipientEmail) {
      console.log('[Pipeline] ℹ️ Email skipped - no recipient email provided');
    } else {
      console.log('[Pipeline] ℹ️ Email skipped - PDF generation failed');
    }

    // Prepare response message
    let message = 'Billing created successfully';
    const pipeline: string[] = [];
    
    if (pdfGenerated) {
      pipeline.push('PDF generated');
    }
    if (emailSent) {
      pipeline.push('Email sent');
    }
    
    if (pipeline.length > 0) {
      message = `Billing created successfully. ${pipeline.join(' and ')}.`;
    }

    // Add warnings if there were errors
    if (pipelineErrors.length > 0) {
      message += ` Note: ${pipelineErrors.join('; ')}`;
    }

    // Return success response with final billing state
    return res.status(201).json({
      success: true,
      message,
      data: finalBilling,
      pipeline: {
        billing: 'Created',
        pdf: pdfGenerated ? 'Generated' : 'Failed',
        email: emailSent ? 'Sent' : (billingData.clientEmail ? 'Failed' : 'Skipped')
      },
      ...(pipelineErrors.length > 0 && { warnings: pipelineErrors })
    });

  } catch (error) {
    console.error('Error creating billing:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      // Duplicate billing number error
      if (error.message.includes('duplicate') || error.message.includes('E11000')) {
        return res.status(409).json({
          success: false,
          message: 'A billing with this number already exists',
          error: error.message
        });
      }
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the billing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get a billing by ID
 * GET /api/billings/:id
 */
export async function getBillingById(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const billingId = Array.isArray(id) ? id[0] : id;

    // Try to find by billing number first (e.g., SEW-202601-001)
    let billing = await BillingService.findByBillingNumber(billingId);
    
    // If not found and looks like a MongoDB ID, try finding by _id
    if (!billing && billingId.match(/^[0-9a-fA-F]{24}$/)) {
      billing = await BillingService.findById(billingId);
    }

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: billing
    });

  } catch (error) {
    console.error('Error fetching billing:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the billing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get all billings with optional filters
 * GET /api/billings
 * 
 * Query Parameters:
 * - status: Filter by billing status (Draft, Generated, Emailed)
 * - emailStatus: Filter by email status (Not Sent, Sent, Failed, Pending)
 * - companyName: Filter by company name (partial match, case-insensitive)
 * - billingNumber: Filter by billing number (partial match)
 * - dateFrom: Filter by date range start (ISO date string)
 * - dateTo: Filter by date range end (ISO date string)
 * - page: Page number for pagination (default: 1)
 * - limit: Number of items per page (default: 10)
 * 
 * Returns: Array of billing records sorted by creation date (newest first)
 */
export async function getAllBillings(req: AuthRequest, res: Response): Promise<Response> {
  try {
    // Ensure user is authenticated
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { 
      status, 
      emailStatus, 
      companyName, 
      billingNumber,
      dateFrom, 
      dateTo, 
      page = '1', 
      limit = '10' 
    } = req.query;

    // Build filters object
    const filters: any = {};
    
    // Non-admin users can only see their own billings
    if (req.user.role !== UserRole.ADMIN) {
      filters.createdBy = req.user.userId;
    }
    
    // Filter by billing status
    if (status && typeof status === 'string') {
      const validStatuses = ['Draft', 'Generated', 'Emailed'];
      if (validStatuses.includes(status)) {
        filters.status = status;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }
    
    // Filter by email status
    if (emailStatus && typeof emailStatus === 'string') {
      const validEmailStatuses = ['Not Sent', 'Sent', 'Failed', 'Pending'];
      if (validEmailStatuses.includes(emailStatus)) {
        filters.emailStatus = emailStatus;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid email status. Must be one of: ${validEmailStatuses.join(', ')}`
        });
      }
    }
    
    // Filter by company name (case-insensitive partial match)
    if (companyName && typeof companyName === 'string') {
      filters.companyName = new RegExp(companyName, 'i');
    }
    
    // Filter by billing number (partial match)
    if (billingNumber && typeof billingNumber === 'string') {
      filters.billingNumber = new RegExp(billingNumber, 'i');
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      filters.billingDate = {};
      
      if (dateFrom && typeof dateFrom === 'string') {
        const fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid dateFrom format. Use ISO date string (e.g., 2026-01-01)'
          });
        }
        filters.billingDate.$gte = fromDate;
      }
      
      if (dateTo && typeof dateTo === 'string') {
        const toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid dateTo format. Use ISO date string (e.g., 2026-01-31)'
          });
        }
        // Set to end of day for inclusive range
        toDate.setHours(23, 59, 59, 999);
        filters.billingDate.$lte = toDate;
      }
    }

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be a positive integer'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit. Must be between 1 and 100'
      });
    }

    // Fetch billings from database (sorted by createdAt DESC - newest first)
    const billings = await BillingService.findAll(filters, pageNum, limitNum);
    const total = await BillingService.count(filters);

    return res.status(200).json({
      success: true,
      message: `Retrieved ${billings.length} billing(s)`,
      data: billings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPreviousPage: pageNum > 1
      },
      filters: {
        status: status || null,
        emailStatus: emailStatus || null,
        companyName: companyName || null,
        billingNumber: billingNumber || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      }
    });

  } catch (error) {
    console.error('Error fetching billings:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching billings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update a billing
 * PUT /api/billings/:id
 */
export async function updateBilling(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Ensure id is a string
    const billingId = Array.isArray(id) ? id[0] : id;

    // Validate if billing exists
    const existingBilling = await BillingService.findById(billingId);
    if (!existingBilling) {
      return res.status(404).json({
        success: false,
        message: 'Billing not found'
      });
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    const updatedBilling = await BillingService.update(billingId, updates);

    return res.status(200).json({
      success: true,
      message: 'Billing updated successfully',
      data: updatedBilling
    });

  } catch (error) {
    console.error('Error updating billing:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the billing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Delete a billing
 * DELETE /api/billings/:id
 */
export async function deleteBilling(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const billingId = Array.isArray(id) ? id[0] : id;

    const billing = await BillingService.findById(billingId);
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing not found'
      });
    }

    await BillingService.delete(billingId);

    return res.status(200).json({
      success: true,
      message: 'Billing deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting billing:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the billing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Send billing invoice via email
 * POST /api/billings/:id/send-email
 */
export async function sendBillingEmail(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const { recipientEmail } = req.body;
    const billingId = Array.isArray(id) ? id[0] : id;

    // Validate recipient email
    if (!recipientEmail || typeof recipientEmail !== 'string') {
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

    // Get billing
    const billing = await BillingService.findById(billingId);
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing not found'
      });
    }

    // Check if PDF exists
    if (!billing.generatedFilePath) {
      return res.status(400).json({
        success: false,
        message: 'Billing PDF has not been generated yet. Please generate the PDF first.'
      });
    }

    // Send email
    try {
      await EmailService.sendBillingInvoice(billing, recipientEmail);

      return res.status(200).json({
        success: true,
        message: `Invoice sent successfully to ${recipientEmail}`,
        data: {
          billingNumber: billing.billingNumber,
          emailSentTo: recipientEmail,
          emailSentAt: new Date(),
          emailStatus: 'Sent'
        }
      });

    } catch (emailError) {
      // Email sending failed
      console.error('Email sending failed:', emailError);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please check email configuration.',
        error: emailError instanceof Error ? emailError.message : 'Unknown email error',
        details: {
          billingNumber: billing.billingNumber,
          recipientEmail,
          emailStatus: 'Failed'
        }
      });
    }

  } catch (error) {
    console.error('Error in sendBillingEmail:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while sending email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Download PDF for a billing
 * GET /api/billings/:id/download-pdf
 */
export async function downloadBillingPdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const billingId = Array.isArray(id) ? id[0] : id;

    // Try to find by billing number first
    let billing = await BillingService.findByBillingNumber(billingId);
    
    // If not found and looks like a MongoDB ID, try finding by _id
    if (!billing && billingId.match(/^[0-9a-fA-F]{24}$/)) {
      billing = await BillingService.findById(billingId);
    }

    if (!billing) {
      res.status(404).json({
        success: false,
        message: 'Billing not found'
      });
      return;
    }

    // Check if PDF was generated
    if (!billing.generatedFilePath) {
      res.status(404).json({
        success: false,
        message: 'PDF has not been generated for this billing yet'
      });
      return;
    }

    // Import fs and path dynamically
    const fs = await import('fs');

    // Check if file exists
    if (!fs.existsSync(billing.generatedFilePath)) {
      res.status(404).json({
        success: false,
        message: 'PDF file not found on server'
      });
      return;
    }

    // Set headers for file download
    const filename = `${billing.billingNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(billing.generatedFilePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while downloading the PDF',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
