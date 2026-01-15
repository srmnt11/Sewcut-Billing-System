/**
 * Draft Billing API Service
 * Handles all API calls related to draft billings
 */

import { BillingItem } from '../components/ItemizedTable';
import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface DraftBillingData {
  _id?: string;
  savedAt?: string;
  billingDate: string;
  deliveryReceiptNumber?: string;
  companyName: string;
  contactNumber: string;
  address: string;
  attentionPerson: string;
  clientEmail?: string;
  items: BillingItem[];
  discount: number;
  subtotal: number;
  grandTotal: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

export class DraftApiService {
  /**
   * Save or update a draft billing
   */
  static async saveDraft(draftData: DraftBillingData): Promise<ApiResponse<DraftBillingData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
        body: JSON.stringify(draftData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save draft');
      }

      return data;
    } catch (error: any) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Get all drafts
   */
  static async getAllDrafts(): Promise<ApiResponse<DraftBillingData[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/drafts`, {
        headers: {
          ...AuthService.getAuthHeader()
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch drafts');
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      throw error;
    }
  }

  /**
   * Get a single draft by ID
   */
  static async getDraftById(id: string): Promise<ApiResponse<DraftBillingData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/drafts/${id}`, {
        headers: {
          ...AuthService.getAuthHeader()
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch draft');
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching draft:', error);
      throw error;
    }
  }

  /**
   * Delete a draft
   */
  static async deleteDraft(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/drafts/${id}`, {
        method: 'DELETE',
        headers: {
          ...AuthService.getAuthHeader()
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete draft');
      }

      return data;
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }
}
