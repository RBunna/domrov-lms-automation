import { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    CheckTransactionByHashDto,
    CheckTransactionResponseDto,
    StartPaymentResponseDto,
    ApiResponse
} from './dto';

/**
 * Start payment for a credit package
 */
export async function startPayment(
    packageId: number,
    token?: string
): Promise<ApiResponse<StartPaymentResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<StartPaymentResponseDto>>(
            `/payment/start-payment/${packageId}`
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Check transaction status by short hash
 */
export async function checkTransactionByHash(
    data: CheckTransactionByHashDto,
    token?: string
): Promise<ApiResponse<CheckTransactionResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<CheckTransactionResponseDto>>(
            `/payment/check_transaction_by_short_hash`,
            data
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}
