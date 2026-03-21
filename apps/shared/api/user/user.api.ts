// /api/user/user.api.ts

import axiosInstance from '../axios';
import {
  UserProfileResponseDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UpdateProfileResponseDto,
  ChangePasswordResponseDto,
  UserListItemDto,
  ApiResponse
} from './dto';

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<ApiResponse<UserProfileResponseDto>> {
  try {
    const response = await axiosInstance.get<ApiResponse<UserProfileResponseDto>>(`/users/me`);
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
export async function updateMyProfile(data: UpdateProfileDto): Promise<ApiResponse<UpdateProfileResponseDto>> {
  try {
    const response = await axiosInstance.patch<ApiResponse<UpdateProfileResponseDto>>(`/users/me`, data);
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
export async function changePassword(data: ChangePasswordDto): Promise<ApiResponse<ChangePasswordResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<ChangePasswordResponseDto>>(`/users/change-password`, data);
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
export async function searchUsers(query?: {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}): Promise<ApiResponse<UserListItemDto[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<UserListItemDto[]>>(`/users/search`, {
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
