// /api/user-ai/user-ai.api.ts
import axiosInstance from '../axios';
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
export async function createUserAIKey(data: CreateUserAIKeyDto): Promise<ApiResponse<UserAIKeyResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<UserAIKeyResponseDto>>(`/user-ai`, data);
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
export async function getAllUserAIKeys(): Promise<ApiResponse<UserAIKeyResponseDto[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<UserAIKeyResponseDto[]>>(`/user-ai`);
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
export async function getUserAIKey(keyId: number): Promise<ApiResponse<UserAIKeyResponseDto>> {
  try {
    const response = await axiosInstance.get<ApiResponse<UserAIKeyResponseDto>>(`/user-ai/${keyId}`);
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
  data: UpdateUserAIKeyDto
): Promise<ApiResponse<UserAIKeyResponseDto>> {
  try {
    const response = await axiosInstance.patch<ApiResponse<UserAIKeyResponseDto>>(`/user-ai/${keyId}`, data);
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
export async function deleteUserAIKey(keyId: number): Promise<ApiResponse<any>> {
  try {
    const response = await axiosInstance.delete<ApiResponse<any>>(`/user-ai/${keyId}`);
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
export async function getUserAIUsageLogs(limit?: number, offset?: number): Promise<ApiResponse<AIUsageLogResponseDto[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<AIUsageLogResponseDto[]>>(`/user-ai/user/logs`, {
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

/**
 * Get usage logs for a specific AI model
 */
export async function getAIModelUsageLogs(keyId: number, limit?: number, offset?: number): Promise<ApiResponse<AIUsageLogResponseDto[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<AIUsageLogResponseDto[]>>(`/user-ai/model/${keyId}`, {
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
