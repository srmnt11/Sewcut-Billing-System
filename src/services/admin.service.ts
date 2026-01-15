/**
 * Admin API Service
 * Handles all API calls related to admin operations
 */

import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

export class AdminService {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user role');
      }

      return data;
    } catch (error: any) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      return data;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
