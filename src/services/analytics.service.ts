/**
 * Analytics API Service
 * Handles all API calls related to analytics and reporting
 */

import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AnalyticsSummary {
  totalBillings: number;
  totalRevenue: number;
  totalSubtotal: number;
  totalDiscount: number;
  averageBillingAmount: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  revenue: number;
}

export interface EmailStatusBreakdown {
  status: string;
  count: number;
}

export interface TopClient {
  companyName: string;
  totalRevenue: number;
  billingCount: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  revenue: number;
  count: number;
}

export interface RecentBilling {
  _id: string;
  billingNumber: string;
  companyName: string;
  grandTotal: number;
  status: string;
  emailStatus: string;
  billingDate: string;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  statusBreakdown: StatusBreakdown[];
  emailStatusBreakdown: EmailStatusBreakdown[];
  topClients: TopClient[];
  monthlyRevenue: MonthlyRevenue[];
  recentBillings: RecentBilling[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export class AnalyticsService {
  /**
   * Get billing analytics
   */
  static async getBillingAnalytics(dateFrom?: string, dateTo?: string): Promise<ApiResponse<AnalyticsData>> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      // Add timestamp to prevent caching
      params.append('_t', Date.now().toString());

      const queryString = params.toString();
      const url = `${API_BASE_URL}/analytics/billings${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}
