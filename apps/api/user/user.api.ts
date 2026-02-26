// /api/user/user.api.ts
import axios from '../base/axios';
import {
  UserResponseDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UserProfileResponseDto,
  UpdateProfileResponseDto
} from './dto';

export async function getUser(id: number): Promise<UserResponseDto> {
  try {
    const res = await axios.get<UserResponseDto>(`/user/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function updateProfile(id: number, data: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
  try {
    const res = await axios.patch<UpdateProfileResponseDto>(`/user/${id}/profile`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function changePassword(id: number, data: ChangePasswordDto): Promise<UserProfileResponseDto> {
  try {
    const res = await axios.patch<UserProfileResponseDto>(`/user/${id}/change-password`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
