import { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    UserProfileResponseDto,
    UpdateProfileDto,
    ChangePasswordDto,
    UpdateProfileResponseDto,
    ChangePasswordResponseDto,
    UserListItemDto,
    ApiResponse,
    SearchUsersQuery
} from './dto';

/**
 * Get current user's profile
 */
export async function getMyProfile(token?: string): Promise<ApiResponse<UserProfileResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<UserProfileResponseDto>>(`/users/me`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Failed to get profile'
        );
    }
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(
    data: UpdateProfileDto,
    token?: string
): Promise<ApiResponse<UpdateProfileResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.patch<ApiResponse<UpdateProfileResponseDto>>(`/users/me`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Failed to update profile'
        );
    }
}

/**
 * Change user's password
 */
export async function changePassword(
    data: ChangePasswordDto,
    token?: string
): Promise<ApiResponse<ChangePasswordResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<ChangePasswordResponseDto>>(`/users/change-password`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Failed to change password'
        );
    }
}

/**
 * Search for users
 */
export async function searchUsers(
    query: SearchUsersQuery,
    token?: string
): Promise<ApiResponse<UserListItemDto[]>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<UserListItemDto[]>>(`/users/search`, {
            params: query
        });
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Failed to search users'
        );
    }
}
