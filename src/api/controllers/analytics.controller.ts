/**
 * Analytics Controller
 * Handles analytics and reporting for billings
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import { BillingModel } from '../models/Billing.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { UserRole } from '../models/User.model.js';

/**
 * Get billing analytics and statistics
 */
export const getBillingAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { dateFrom, dateTo } = req.query;

    // Build base filter
    const baseFilter: any = {};

    // Non-admin users can only see their own billings
    // IMPORTANT: Use ObjectId for aggregation pipelines (aggregation doesn't auto-convert strings)
    if (req.user.role !== UserRole.ADMIN) {
      baseFilter.createdBy = new mongoose.Types.ObjectId(req.user.userId);
    }

    // Apply date range filter if provided
    if (dateFrom || dateTo) {
      baseFilter.billingDate = {};
      if (dateFrom && typeof dateFrom === 'string') {
        baseFilter.billingDate.$gte = new Date(dateFrom);
      }
      if (dateTo && typeof dateTo === 'string') {
        baseFilter.billingDate.$lte = new Date(dateTo);
      }
    }

    // Get total billings count
    const totalBillings = await BillingModel.countDocuments(baseFilter);

    // Get total revenue (sum of all grandTotals)
    const revenueResult = await BillingModel.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalSubtotal: { $sum: '$subtotal' },
          totalDiscount: { $sum: '$discount' }
        }
      }
    ]);

    console.log('Analytics - Base Filter:', JSON.stringify(baseFilter));
    console.log('Analytics - Revenue Result:', JSON.stringify(revenueResult));

    const revenue = revenueResult[0] || {
      totalRevenue: 0,
      totalSubtotal: 0,
      totalDiscount: 0
    };

    // Get status breakdown
    const statusBreakdown = await BillingModel.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$grandTotal' }
        }
      }
    ]);

    // Get email status breakdown
    const emailStatusBreakdown = await BillingModel.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$emailStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top clients by revenue
    const topClients = await BillingModel.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$companyName',
          totalRevenue: { $sum: '$grandTotal' },
          billingCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Get monthly revenue trend (last 12 months)
    const monthlyRevenue = await BillingModel.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            year: { $year: '$billingDate' },
            month: { $month: '$billingDate' }
          },
          revenue: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get recent billings (last 10)
    const recentBillings = await BillingModel.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('billingNumber companyName grandTotal status emailStatus billingDate')
      .lean();

    // Calculate average billing amount
    const averageBillingAmount = totalBillings > 0 
      ? revenue.totalRevenue / totalBillings 
      : 0;

    // Disable caching for real-time data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBillings,
          totalRevenue: revenue.totalRevenue,
          totalSubtotal: revenue.totalSubtotal,
          totalDiscount: revenue.totalDiscount,
          averageBillingAmount
        },
        statusBreakdown: statusBreakdown.map(item => ({
          status: item._id,
          count: item.count,
          revenue: item.revenue
        })),
        emailStatusBreakdown: emailStatusBreakdown.map(item => ({
          status: item._id,
          count: item.count
        })),
        topClients: topClients.map(item => ({
          companyName: item._id,
          totalRevenue: item.totalRevenue,
          billingCount: item.billingCount
        })),
        monthlyRevenue: monthlyRevenue.map(item => ({
          year: item._id.year,
          month: item._id.month,
          revenue: item.revenue,
          count: item.count
        })).reverse(),
        recentBillings
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};
