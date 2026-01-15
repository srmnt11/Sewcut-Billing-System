/**
 * Billing API Routes
 * Express router configuration for billing endpoints
 */

import { Router } from 'express';
import {
  createBilling,
  getBillingById,
  getAllBillings,
  updateBilling,
  deleteBilling,
  sendBillingEmail,
  downloadBillingPdf
} from '../controllers/billing.controller';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/billings
 * @desc    Create a new billing
 * @access  Private (requires authentication)
 * @body    {
 *   billingDate: string,
 *   deliveryReceiptNumber?: string,
 *   companyName: string,
 *   address: string,
 *   contactNumber: string,
 *   attentionPerson: string,
 *   items: BillingItem[],
 *   discount: number
 * }
 * @returns 201 - Created billing
 * @returns 400 - Validation errors
 * @returns 409 - Duplicate billing number
 * @returns 500 - Server error
 */
router.post('/', createBilling);

/**
 * @route   GET /api/billings
 * @desc    Get all billings with optional filters
 * @access  Private
 * @query   {
 *   status?: BillingStatus,
 *   emailStatus?: EmailStatus,
 *   companyName?: string,
 *   dateFrom?: string,
 *   dateTo?: string,
 *   page?: number,
 *   limit?: number
 * }
 * @returns 200 - Array of billings with pagination
 * @returns 500 - Server error
 */
router.get('/', getAllBillings);

/**
 * @route   GET /api/billings/:id
 * @desc    Get a single billing by ID
 * @access  Private
 * @param   id - Billing ID
 * @returns 200 - Billing document
 * @returns 404 - Billing not found
 * @returns 500 - Server error
 */
router.get('/:id', getBillingById);

/**
 * @route   PUT /api/billings/:id
 * @desc    Update a billing
 * @access  Private
 * @param   id - Billing ID
 * @body    UpdateBillingDTO
 * @returns 200 - Updated billing
 * @returns 404 - Billing not found
 * @returns 500 - Server error
 */
router.put('/:id', updateBilling);

/**
 * @route   DELETE /api/billings/:id
 * @desc    Delete a billing
 * @access  Private
 * @param   id - Billing ID
 * @returns 200 - Success message
 * @returns 404 - Billing not found
 * @returns 500 - Server error
 */
router.delete('/:id', deleteBilling);
/**
 * @route   POST /api/billings/:id/send-email
 * @desc    Send billing invoice via email
 * @access  Private
 * @param   id - Billing ID
 * @body    {
 *   recipientEmail: string
 * }
 * @returns 200 - Email sent successfully
 * @returns 400 - PDF not generated or validation error
 * @returns 404 - Billing not found
 * @returns 500 - Email sending error
 */
router.post('/:id/send-email', sendBillingEmail);

/**
 * @route   GET /api/billings/:id/download-pdf
 * @desc    Download PDF for a billing
 * @access  Private
 * @param   id - Billing ID or billing number
 * @returns 200 - PDF file
 * @returns 404 - Billing or PDF not found
 * @returns 500 - Server error
 */
router.get('/:id/download-pdf', downloadBillingPdf);


export default router;
