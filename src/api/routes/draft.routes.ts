/**
 * Draft Billing API Routes
 * Express router configuration for draft billing endpoints
 */

import { Router } from 'express';
import {
  saveDraft,
  getAllDrafts,
  getDraftById,
  deleteDraft
} from '../controllers/draft.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/drafts
 * @desc    Create or update a draft billing
 * @access  Private (requires authentication)
 * @body    DraftBilling
 * @returns 201 - Draft saved
 * @returns 200 - Draft updated
 * @returns 500 - Server error
 */
router.post('/', saveDraft);

/**
 * @route   GET /api/drafts
 * @desc    Get all draft billings
 * @access  Private
 * @returns 200 - Array of drafts
 * @returns 500 - Server error
 */
router.get('/', getAllDrafts);

/**
 * @route   GET /api/drafts/:id
 * @desc    Get a single draft by ID
 * @access  Private
 * @param   id - Draft ID
 * @returns 200 - Draft document
 * @returns 404 - Draft not found
 * @returns 500 - Server error
 */
router.get('/:id', getDraftById);

/**
 * @route   DELETE /api/drafts/:id
 * @desc    Delete a draft
 * @access  Private
 * @param   id - Draft ID
 * @returns 200 - Success message
 * @returns 404 - Draft not found
 * @returns 500 - Server error
 */
router.delete('/:id', deleteDraft);

export default router;
