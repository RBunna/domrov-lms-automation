// /api/user/dto.ts

import { UserStatus } from '../enums/UserStatus';

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl: string | null;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dob?: Date;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserProfileResponseDto {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  gender?: string;
  dob?: Date;
  phoneNumber?: string;
  profilePictureUrl?: string;
  isVerified: boolean;
  isTwoFactorEnable: boolean;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateProfileResponseDto {
  message: string;
  user: UserProfileResponseDto;
}

export interface ChangePasswordResponseDto {
  message: string;
}

export interface UserListItemDto {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  status: UserStatus;
  isVerified: boolean;
}
