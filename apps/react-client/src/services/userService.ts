import axiosInstance from '@/lib/axiosInstance';
import type { ApiResponse } from '@/types/api';
import type {
    UserProfileResponseDto,
    UpdateProfileDto,
    ChangePasswordDto,
    UpdateProfileResponseDto,
    ChangePasswordResponseDto,
    UserListItemDto,
} from '@/types/user';

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<ApiResponse<UserProfileResponseDto>> {
    const response = await axiosInstance.get<ApiResponse<UserProfileResponseDto>>('/users/me');
    return response.data;
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(data: UpdateProfileDto): Promise<ApiResponse<UpdateProfileResponseDto>> {
    const response = await axiosInstance.patch<ApiResponse<UpdateProfileResponseDto>>('/users/me', data);
    return response.data;
}

/**
 * Change user's password
 */
export async function changePassword(data: ChangePasswordDto): Promise<ApiResponse<ChangePasswordResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<ChangePasswordResponseDto>>('/users/change-password', data);
    return response.data;
}

/**
 * Search for users
 */
export async function searchUsers(query?: {
    id?: number;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}): Promise<ApiResponse<UserListItemDto[]>> {
    const response = await axiosInstance.get<ApiResponse<UserListItemDto[]>>('/users/search', {
        params: query
    });
    return response.data;
}

const userService = {
    getMyProfile,
    updateMyProfile,
    changePassword,
    searchUsers,
};

export default userService;
