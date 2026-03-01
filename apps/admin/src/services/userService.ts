// User Service - Handles all user-related data operations

import { apiClient } from './api';

export interface User {
  id: number;
  firstName?: string;
  lastName?: string | null;
  gender?: string | null;
  dob?: string | null;
  email: string;
  phoneNumber?: string | null;
  profilePictureUrl?: string | null;
  isVerified?: boolean;
  status: 'active' | 'suspended' | 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'SUSPENDED' | 'active' | 'inactive' | 'banned' | 'suspended';
  role?: string;
  credits?: number;
  joinDate?: string;
  lastActivity?: string;
  totalPurchased?: number;
  // Deprecated fields for backward compatibility
  avatar?: string;
  name?: string;
  balance?: number;
  created?: string;
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  credits: number;
  status: string;
  joinDate: string;
  totalSpent: number;
  recentTransactions: Array<{
    id: number;
    amount: number;
    date: string;
    status: string;
  }>;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardUserListResponse {
  data: Array<{
    id: number;
    avatar: string;
    name: string;
    email: string;
    role: string;
    balance: number;
    status: string;
    created: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
}

export interface CreditsResponse {
  userId: number;
  previousBalance: number;
  newBalance: number;
  transactionId: number;
  timestamp: string;
}

class UserService {
  async fetchUsers(page: number = 1, limit: number = 10, status?: string, search?: string): Promise<UserListResponse> {
    try {
      // API returns { success: true, data: { data: [...items], total, page, limit } }
      // request function automatically unwraps to { data: [...items], total, page, limit }
      const response = await apiClient.users.getAll(page, limit, status, search);
      // Extract the items array from the paginated response
      const itemsData = response.data || [];

      const users: User[] = itemsData.map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName || null,
        gender: u.gender || null,
        dob: u.dob || null,
        email: u.email,
        phoneNumber: u.phoneNumber || null,
        profilePictureUrl: u.profilePictureUrl || null,
        isVerified: u.isVerified || false,
        status: u.status,
        role: u.role,
        credits: u.credits || 0,
        joinDate: u.joinDate,
        lastActivity: u.lastActivity,
        totalPurchased: u.totalPurchased || 0,
      }));
      return {
        data: users,
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 10,
      };
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  async fetchUserById(id: number): Promise<User | null> {
    try {
      // API returns { success: true, data: { id, firstName, email, ... } }
      // request function automatically unwraps to { id, firstName, email, ... }
      const response = await apiClient.users.getById(id);
      return {
        id: response.id,
        firstName: response.firstName,
        lastName: response.lastName || null,
        gender: response.gender || null,
        dob: response.dob || null,
        email: response.email,
        phoneNumber: response.phoneNumber || null,
        profilePictureUrl: response.profilePictureUrl || null,
        isVerified: response.isVerified,
        status: response.status,
        role: response.role,
        credits: response.credits || 0,
        joinDate: response.joinDate,
        lastActivity: response.lastActivity,
        totalPurchased: response.totalPurchased || 0,
      } as User;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      return null;
    }
  }

  async addCredits(userId: number, amount: number, reason: string, adminNote?: string): Promise<any> {
    try {
      // API returns { success: true, data: { message: "...", userId, newBalance, ... } }
      // request function automatically unwraps to { message: "...", userId, newBalance, ... }
      const response = await apiClient.users.addCredits(userId, amount, reason, adminNote);
      return response;
    } catch (error) {
      console.error(`Failed to add credits for user ${userId}:`, error);
      throw error;
    }
  }

  async deductCredits(userId: number, amount: number, reason: string, adminNote?: string): Promise<any> {
    try {
      // API returns { success: true, data: { message: "...", userId, newBalance, ... } }
      // request function automatically unwraps to { message: "...", userId, newBalance, ... }
      const response = await apiClient.users.deductCredits(userId, amount, reason, adminNote);
      return response;
    } catch (error) {
      console.error(`Failed to deduct credits for user ${userId}:`, error);
      throw error;
    }
  }

  async updateUserStatus(userId: number, status: 'active' | 'suspended' | 'banned' | 'inactive', reason?: string): Promise<any> {
    try {
      // API returns { success: true, data: { message: "...", userId, updatedStatus, ... } }
      // request function automatically unwraps to { message: "...", userId, updatedStatus, ... }
      const response = await apiClient.users.updateStatus(userId, status as any, reason);
      return response;
    } catch (error) {
      console.error(`Failed to update user status for ${userId}:`, error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<any> {
    try {
      // API returns { success: true, data: { message: "..." } }
      // request function automatically unwraps to { message: "..." }
      const response = await apiClient.users.delete(userId);
      return response;
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error);
      throw error;
    }
  }

  async fetchDashboardUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    role?: string
  ): Promise<DashboardUserListResponse> {
    try {
      // API returns { success: true, data: { data: [...], total: 100, page: 1, limit: 10, totalPages: 5 } }
      const response = await apiClient.dashboard.getUsers(page, limit, search, status, role);

      return {
        data: response.data || [],
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 10,
        totalPages: response.totalPages || 1,
        totalRecords: response.total || 0, // totalRecords same as total
      };
    } catch (error) {
      console.error('Failed to fetch dashboard users:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
