/**
 * Analytics API Routes
 * Express router configuration for analytics endpoints
 */

import { Router } from 'express';
import { getBillingAnalytics } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/analytics/billings
 * @desc    Get billing analytics and statistics
 * @access  Private (requires authentication)
 * @query   dateFrom, dateTo (optional date range)
 * @returns Analytics data with summary, breakdowns, trends
 */
router.get('/billings', getBillingAnalytics);

export default router;
