// /api/admin-wallet/admin-wallet.api.ts
import axios from '../base/axios';
import {
  AdminAdjustWalletDTO,
  AdminAdjustWalletResponseDto,
  AdminDeductResponseDto
} from './dto';

export async function adminAdjustWallet(data: AdminAdjustWalletDTO): Promise<AdminAdjustWalletResponseDto> {
  try {
    const res = await axios.post<AdminAdjustWalletResponseDto>(`/admin-wallet/adjust`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function adminDeductWallet(data: AdminAdjustWalletDTO): Promise<AdminDeductResponseDto> {
  try {
    const res = await axios.post<AdminDeductResponseDto>(`/admin-wallet/deduct`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
