import { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    CreateUserAIKeyDto,
    UserAIKeyResponseDto,
    UpdateUserAIKeyDto,
    AIUsageLogResponseDto,
    ApiResponse
} from './dto';

/**
 * Create a new AI key for the user
 */
export async function createUserAIKey(
    data: CreateUserAIKeyDto,
    token?: string
): Promise<ApiResponse<UserAIKeyResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<UserAIKeyResponseDto>>(`/user-ai`, data);
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
 * Get all AI keys for the user
 */
export async function getAllUserAIKeys(token?: string): Promise<ApiResponse<UserAIKeyResponseDto[]>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<UserAIKeyResponseDto[]>>(`/user-ai`);
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
 * Get a specific AI key by ID
 */
export async function getUserAIKey(
    keyId: number,
    token?: string
): Promise<ApiResponse<UserAIKeyResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<UserAIKeyResponseDto>>(`/user-ai/${keyId}`);
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
 * Update an AI key
 */
export async function updateUserAIKey(
    keyId: number,
    data: UpdateUserAIKeyDto,
    token?: string
): Promise<ApiResponse<UserAIKeyResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.patch<ApiResponse<UserAIKeyResponseDto>>(`/user-ai/${keyId}`, data);
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
 * Delete an AI key
 */
export async function deleteUserAIKey(
    keyId: number,
    token?: string
): Promise<ApiResponse<any>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.delete<ApiResponse<any>>(`/user-ai/${keyId}`);
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
 * Get usage logs for the user's AI keys
 */
export async function getUserAIUsageLogs(
    limit?: number,
    offset?: number,
    token?: string
): Promise<ApiResponse<AIUsageLogResponseDto[]>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<AIUsageLogResponseDto[]>>(`/user-ai/user/logs`, {
            params: { limit, offset }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}
