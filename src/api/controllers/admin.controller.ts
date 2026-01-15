/**
 * Admin Controller
 * Handles admin-only operations like user management
 */

import { Response } from 'express';
import { UserModel, UserRole } from '../models/User.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.find()
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`
      });
      return;
    }

    // Prevent admin from changing their own role
    if (userId === req.user?.userId) {
      res.status(403).json({
        success: false,
        message: 'You cannot change your own role'
      });
      return;
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user?.userId) {
      res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
      return;
    }

    const user = await UserModel.findByIdAndDelete(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};
