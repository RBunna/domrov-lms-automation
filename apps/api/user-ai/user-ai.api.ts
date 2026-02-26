// /api/user-ai/user-ai.api.ts
import axios from '../base/axios';
import {
  CreateUserAIKeyDto,
  UpdateUserAIKeyDto
} from './dto';

export async function createUserAIKey(data: CreateUserAIKeyDto): Promise<void> {
  try {
    await axios.post(`/user-ai/key`, data);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function updateUserAIKey(id: number, data: UpdateUserAIKeyDto): Promise<void> {
  try {
    await axios.patch(`/user-ai/key/${id}`, data);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function deleteUserAIKey(id: number): Promise<void> {
  try {
    await axios.delete(`/user-ai/key/${id}`);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
