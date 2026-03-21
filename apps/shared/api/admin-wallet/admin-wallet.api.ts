// /api/admin-wallet/admin-wallet.api.ts

import axiosInstance from '../axios';
import { TransactionType } from '../enums/TransactionType';
import { TransactionReason } from '../enums/TransactionReason';
import { Currency } from '../enums/Currency';

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface CreateCreditPackageDto {
  name: string;
  description?: string;
  credits: number;
  price: number;
  currency?: Currency;
  bonusCredits?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreditPackageResponseDto {
  id: number;
  name: string;
  description?: string;
  credits: number;
  bonusCredits: number;
  price: number;
  currency: Currency;
  discountInPercent: number;
  isActive: boolean;
  sortOrder?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AdminAdjustWalletDTO {
  userId: number;
  amount: number;
  type: TransactionType;
  reason: TransactionReason;
  description: string;
}

export interface AdminAdjustWalletResponseDto {
  id: number;
  creditBalance: number;
  updated_at: Date;
}

export interface AdminDeductResponseDto {
  success: boolean;
}

export interface TransactionResponseDto {
  id: number;
  user: string;
  userId: number | null;
  amount: number;
  currency?: string;
  method?: string;
  status?: string;
  date: string;
  transactionType: 'payment' | 'admin_adjustment';
  adjustmentType?: 'credit' | 'debit' | 'purchase';
  reason?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  description?: string;
  metadata?: Record<string, any>;
  userNote?: string | null;
  proofImageUrl?: string | null;
  verificationNote?: string | null;
  creditPackage?: {
    id: number;
    name: string;
    credits: number;
    bonusCredits: number;
  };
}

export interface TransactionListResponseDto {
  data: TransactionResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionDetailDto {
  id: number;
  user: string;
  userId: number | null;
  amount: number;
  currency?: string;
  method?: string;
  status?: string;
  date: string;
  transactionType: 'payment' | 'admin_adjustment';
  transactionDetails?: Record<string, any>;
  adjustmentType?: 'credit' | 'debit' | 'purchase';
  reason?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  description?: string;
  metadata?: Record<string, any>;
  creditPackage?: {
    id: number;
    name: string;
    credits: number;
    bonusCredits: number;
  };
}

/**
 * Create new credit package
 */
export async function createCreditPackage(data: CreateCreditPackageDto): Promise<ApiResponse<CreditPackageResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<CreditPackageResponseDto>>('/admin/wallet/packages', data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to create credit package'
    );
  }
}

/**
 * Get all credit packages (active & inactive)
 */
export async function getAllCreditPackages(): Promise<ApiResponse<CreditPackageResponseDto[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<CreditPackageResponseDto[]>>('/admin/wallet/packages');
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to get credit packages'
    );
  }
}

/**
 * Toggle credit package active status
 */
export async function toggleCreditPackage(packageId: number): Promise<ApiResponse<CreditPackageResponseDto>> {
  try {
    const response = await axiosInstance.patch<ApiResponse<CreditPackageResponseDto>>(`/admin/wallet/packages/${packageId}/toggle`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to toggle credit package'
    );
  }
}

/**
 * Manually adjust user wallet balance
 */
export async function adjustWalletBalance(data: AdminAdjustWalletDTO): Promise<ApiResponse<AdminAdjustWalletResponseDto | AdminDeductResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<AdminAdjustWalletResponseDto | AdminDeductResponseDto>>('/admin/wallet/adjust', data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to adjust wallet balance'
    );
  }
}

/**
 * Get all transactions with pagination and filtering
 */
export async function getAllTransactions(
  page: number = 1,
  limit: number = 10,
  status: string = 'all',
  transactionType: string = 'all',
  search: string = ''
): Promise<ApiResponse<TransactionListResponseDto>> {
  try {
    const response = await axiosInstance.get<ApiResponse<TransactionListResponseDto>>('/admin/wallet/transactions', {
      params: { page, limit, status, transactionType, search }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to get transactions'
    );
  }
}

/**
 * Get transaction details by ID
 */
export async function getTransactionDetails(transactionId: string): Promise<ApiResponse<TransactionDetailDto>> {
  try {
    const response = await axiosInstance.get<ApiResponse<TransactionDetailDto>>(`/admin/wallet/transactions/${transactionId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to get transaction details'
    );
  }
}