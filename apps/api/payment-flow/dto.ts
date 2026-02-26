// /api/payment-flow/dto.ts
export interface AdminAdjustWalletDto {
  walletId: number;
  amount: number;
  reason: string;
  description?: string;
}

export interface AdminAdjustResponseDto {
  message: string;
  walletId: number;
  balanceBefore: number;
  balanceAfter: number;
}
