// /api/payment-flow/payment-flow.api.ts
import axios from '../base/axios';
import {
  AdminAdjustWalletDto,
  AdminAdjustResponseDto
} from './dto';

export async function adminAdjustWallet(data: AdminAdjustWalletDto): Promise<AdminAdjustResponseDto> {
  try {
    const res = await axios.post<AdminAdjustResponseDto>(`/payment-flow/admin-adjust-wallet`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
