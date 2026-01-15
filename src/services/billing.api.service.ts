/**
 * API Service for Billing Operations
 * Handles all API calls to the backend
 */

import { CreateBillingDTO } from '../types/billing.types';
import { AuthService } from './auth.service';

// API base URL - configured via environment variable
// Vite uses import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * API Response interface
 */
interface ApiResponse<T> {
  warnings: boolean;
  pipeline: any;
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  error?: string;
}

/**
 * Billing API Service
 */
export class BillingApiService {
  /**
   * Create a new billing
   * @param billingData - Billing data to create
   * @returns Created billing data
   */
  static async createBilling(billingData: CreateBillingDTO): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/billings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
        body: JSON.stringify(billingData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        throw {
          status: response.status,
          ...result
        };
      }

      return result;

    } catch (error: any) {
      console.error('Error creating billing:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          success: false,
          message: 'Unable to connect to the server. Please check your internet connection.',
          error: 'Network error'
        };
      }

      // Re-throw API errors
      throw error;
    }
  }

  /**
   * Get all billings with optional filters
   * @param params - Query parameters
   * @returns List of billings
   */
  static async getAllBillings(params?: Record<string, any>): Promise<ApiResponse<any[]>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      
      const response = await fetch(`${API_BASE_URL}/billings${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          ...result
        };
      }

      return result;

    } catch (error: any) {
      console.error('Error fetching billings:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          success: false,
          message: 'Unable to connect to the server.',
          error: 'Network error'
        };
      }

      throw error;
    }
  }

  /**
   * Get a single billing by ID
   * @param id - Billing ID
   * @returns Billing data
   */
  static async getBillingById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/billings/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          ...result
        };
      }

      return result;

    } catch (error: any) {
      console.error('Error fetching billing:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          success: false,
          message: 'Unable to connect to the server.',
          error: 'Network error'
        };
      }

      throw error;
    }
  }

  /**
   * Update a billing
   * @param id - Billing ID
   * @param updates - Fields to update
   * @returns Updated billing data
   */
  static async updateBilling(id: string, updates: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/billings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          ...result
        };
      }

      return result;

    } catch (error: any) {
      console.error('Error updating billing:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          success: false,
          message: 'Unable to connect to the server.',
          error: 'Network error'
        };
      }

      throw error;
    }
  }

  /**
   * Delete a billing
   * @param id - Billing ID
   * @returns Success response
   */
  static async deleteBilling(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/billings/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          ...result
        };
      }

      return result;

    } catch (error: any) {
      console.error('Error deleting billing:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          success: false,
          message: 'Unable to connect to the server.',
          error: 'Network error'
        };
      }

      throw error;
    }
  }
}
