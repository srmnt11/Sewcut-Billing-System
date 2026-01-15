/**
 * Admin API Routes
 * Express router configuration for admin endpoints (admin-only access)
 */

import { Router } from 'express';
import { getAllUsers, updateUserRole, deleteUser } from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication and admin requirement to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin only
 * @returns 200 - Array of users
 * @returns 403 - Not admin
 * @returns 500 - Server error
 */
router.get('/users', getAllUsers);

/**
 * @route   PUT /api/admin/users/:userId/role
 * @desc    Update user role
 * @access  Admin only
 * @param   userId - User ID
 * @body    { role: 'user' | 'admin' }
 * @returns 200 - User updated
 * @returns 400 - Invalid role
 * @returns 403 - Cannot change own role
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
router.put('/users/:userId/role', updateUserRole);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user
 * @access  Admin only
 * @param   userId - User ID
 * @returns 200 - User deleted
 * @returns 403 - Cannot delete own account
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
router.delete('/users/:userId', deleteUser);

export default router;
