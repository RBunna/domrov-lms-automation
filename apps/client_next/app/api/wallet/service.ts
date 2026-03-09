import { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    WalletBalanceResponseDto,
    TransactionHistoryResponseDto,
    CreditPackageResponseDto,
} from './dto';

/**
 * Get user's current wallet balance
 */
export async function getWalletBalance(token?: string): Promise<WalletBalanceResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<WalletBalanceResponseDto>('/wallet/balance');
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Failed to get wallet balance'
        );
    }
}

/**
 * Get transaction history with pagination
 */
export async function getTransactionHistory(
    page: number = 1,
    limit: number = 10,
    token?: string
): Promise<TransactionHistoryResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<TransactionHistoryResponseDto>(
            '/wallet/transactions',
            {
                params: { page, limit },
            }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Failed to get transaction history'
        );
    }
}

/**
 * Get available credit packages for purchase
 */
export async function getCreditPackages(token?: string): Promise<CreditPackageResponseDto[]> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<CreditPackageResponseDto[]>('/wallet/packages');
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Failed to get credit packages'
        );
    }
}
