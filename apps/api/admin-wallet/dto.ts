// /api/admin-wallet/dto.ts
export interface AdminAdjustWalletDTO {
  userId: number;
  amount: number;
  type: string;
  reason: string;
  description: string;
}

export interface AdminAdjustWalletResponseDto {
  id: number;
  creditBalance: number;
  updated_at: Date;
}

export interface AdminDeductResponseDto {
  success: boolean;
}
