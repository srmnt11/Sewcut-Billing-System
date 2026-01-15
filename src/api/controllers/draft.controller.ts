/**
 * Draft Billing Controller
 * Handles all draft billing-related HTTP requests
 */

import { Response } from 'express';
import { DraftBillingModel } from '../models/Draft.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { UserRole } from '../models/User.model.js';

/**
 * Create or update a draft billing
 */
export const saveDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const draftData = req.body;
    
    // If draft has an ID, update existing; otherwise create new
    if (draftData._id) {
      // Verify ownership for non-admin users
      if (req.user.role !== UserRole.ADMIN) {
        const existingDraft = await DraftBillingModel.findById(draftData._id);
        if (existingDraft && existingDraft.createdBy?.toString() !== req.user.userId) {
          res.status(403).json({
            success: false,
            message: 'You do not have permission to edit this draft'
          });
          return;
        }
      }

      const updatedDraft = await DraftBillingModel.findByIdAndUpdate(
        draftData._id,
        { ...draftData, savedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!updatedDraft) {
        res.status(404).json({
          success: false,
          message: 'Draft not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Draft updated successfully',
        data: updatedDraft
      });
    } else {
      // Create new draft
      const newDraft = new DraftBillingModel({
        ...draftData,
        createdBy: req.user.userId,
        savedAt: new Date()
      });
      
      const savedDraft = await newDraft.save();
      
      res.status(201).json({
        success: true,
        message: 'Draft saved successfully',
        data: savedDraft
      });
    }
  } catch (error: any) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save draft',
      error: error.message
    });
  }
};

/**
 * Get all drafts
 */
export const getAllDrafts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Build filter: non-admin users can only see their own drafts
    const filter: any = {};
    if (req.user.role !== UserRole.ADMIN) {
      filter.createdBy = req.user.userId;
    }

    const drafts = await DraftBillingModel.find(filter)
      .sort({ savedAt: -1 }) // Sort by most recent first
      .lean();
    
    res.status(200).json({
      success: true,
      data: drafts,
      count: drafts.length
    });
  } catch (error: any) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drafts',
      error: error.message
    });
  }
};

/**
 * Get a single draft by ID
 */
export const getDraftById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;
    
    const draft = await DraftBillingModel.findById(id).lean();
    
    if (!draft) {
      res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
      return;
    }

    // Verify ownership for non-admin users
    if (req.user.role !== UserRole.ADMIN && draft.createdBy?.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this draft'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: draft
    });
  } catch (error: any) {
    console.error('Error fetching draft:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch draft',
      error: error.message
    });
  }
};

/**
 * Delete a draft
 */
export const deleteDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;
    
    const draft = await DraftBillingModel.findById(id);
    
    if (!draft) {
      res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
      return;
    }

    // Verify ownership for non-admin users
    if (req.user.role !== UserRole.ADMIN && draft.createdBy?.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this draft'
      });
      return;
    }
    
    await DraftBillingModel.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete draft',
      error: error.message
    });
  }
};
