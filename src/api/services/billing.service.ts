/**
 * Billing Service
 * Database operations for billing records using MongoDB with Mongoose
 */

import { Billing } from '../../types/billing.types.js';
import { BillingModel } from '../models/Billing.model.js';

/**
 * Billing Service Class
 * Handles all database operations for billings
 */
export class BillingService {
  /**
   * Create a new billing record in the database
   * @param billingData - Billing data to create
   * @returns Created billing with _id
   */
  static async create(billingData: Omit<Billing, '_id'>): Promise<Billing> {
    try {
      const billing = new BillingModel(billingData);
      const savedBilling = await billing.save();
      return savedBilling.toObject() as Billing;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('A billing with this billing number already exists');
      }
      throw error;
    }
  }

  /**
   * Find a billing by ID
   * @param id - Billing ID
   * @returns Billing document or null
   */
  static async findById(_id: string): Promise<Billing | null> {
    try {
      const billing = await BillingModel.findById(_id).lean();
      return billing as Billing | null;
    } catch (error) {
      console.error('Error finding billing by ID:', error);
      return null;
    }
  }

  /**
   * Find a billing by billing number
   * @param billingNumber - Billing number
   * @returns Billing document or null
   */
  static async findByBillingNumber(billingNumber: string): Promise<Billing | null> {
    try {
      const billing = await BillingModel.findOne({ billingNumber }).lean();
      return billing as Billing | null;
    } catch (error) {
      console.error('Error finding billing by billing number:', error);
      return null;
    }
  }

  /**
   * Find all billings with optional filters and pagination
   * Returns billings sorted by creation date (newest first)
   * @param filters - Query filters
   * @param page - Page number
   * @param limit - Items per page
   * @returns Array of billing documents sorted by createdAt DESC
   */
  static async findAll(
    filters: any = {}, 
    page: number = 1, 
    limit: number = 10
  ): Promise<Billing[]> {
    try {
      const skip = (page - 1) * limit;
      const billings = await BillingModel.find(filters)
        .sort({ createdAt: -1 }) // Sort by createdAt descending (newest first)
        .skip(skip)
        .limit(limit)
        .lean(); // Convert to plain JavaScript objects for better performance
      
      return billings as Billing[];
    } catch (error) {
      console.error('Error finding billings:', error);
      return [];
    }
  }

  /**
   * Count billings matching filters
   * @param filters - Query filters
   * @returns Count of matching documents
   */
  static async count(filters: any = {}): Promise<number> {
    try {
      return await BillingModel.countDocuments(filters);
    } catch (error) {
      console.error('Error counting billings:', error);
      return 0;
    }
  }

  /**
   * Update a billing by ID
   * @param _id - Billing ID
   * @param updates - Fields to update
   * @returns Updated billing document
   */
  static async update(_id: string, updates: Partial<Billing>): Promise<Billing | null> {
    try {
      const updatedBilling = await BillingModel.findByIdAndUpdate(
        _id, 
        { $set: updates }, 
        { new: true, runValidators: true }
      ).lean();
      
      return updatedBilling as Billing | null;
    } catch (error) {
      console.error('Error updating billing:', error);
      return null;
    }
  }

  /**
   * Delete a billing by ID
   * @param _id - Billing ID
   * @returns Deleted billing document
   */
  static async delete(_id: string): Promise<Billing | null> {
    try {
      const deletedBilling = await BillingModel.findByIdAndDelete(_id).lean();
      return deletedBilling as Billing | null;
    } catch (error) {
      console.error('Error deleting billing:', error);
      return null;
    }
  }

  /**
   * Get billing statistics for dashboard
   * @returns Statistics object
   */
  static async getStatistics(): Promise<{
    totalBillings: number;
    billingsThisMonth: number;
    emailedBillings: number;
    totalRevenue: number;
    revenueThisMonth: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [
        totalBillings,
        billingsThisMonth,
        emailedBillings,
        totalRevenue,
        revenueThisMonth
      ] = await Promise.all([
        BillingModel.countDocuments(),
        BillingModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
        BillingModel.countDocuments({ emailStatus: 'Sent' }),
        BillingModel.aggregate([
          { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ]).then(result => result[0]?.total || 0),
        BillingModel.aggregate([
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ]).then(result => result[0]?.total || 0)
      ]);
      
      return {
        totalBillings,
        billingsThisMonth,
        emailedBillings,
        totalRevenue,
        revenueThisMonth
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalBillings: 0,
        billingsThisMonth: 0,
        emailedBillings: 0,
        totalRevenue: 0,
        revenueThisMonth: 0
      };
    }
  }
}
