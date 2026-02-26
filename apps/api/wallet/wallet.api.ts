// /api/wallet/wallet.api.ts
import axios from '../base/axios';
import {
  AddCreditsDto,
  DeductCreditsDto,
  WalletTransactionResponseDto,
  TransactionHistoryMetaDto,
  StartPaymentDto,
  StartPaymentResponseDto,
  CreditPackageResponseDto,
  Currency
} from './dto';

export async function addCredits(data: AddCreditsDto): Promise<WalletTransactionResponseDto> {
  try {
    const res = await axios.post<WalletTransactionResponseDto>(`/wallet/add-credits`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function deductCredits(data: DeductCreditsDto): Promise<WalletTransactionResponseDto> {
  try {
    const res = await axios.post<WalletTransactionResponseDto>(`/wallet/deduct-credits`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function getTransactionHistory(walletId: number, page: number = 1): Promise<{ meta: TransactionHistoryMetaDto; transactions: WalletTransactionResponseDto[] }> {
  try {
    const res = await axios.get<{ meta: TransactionHistoryMetaDto; transactions: WalletTransactionResponseDto[] }>(`/wallet/${walletId}/transactions`, {
      params: { page }
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function startPayment(data: StartPaymentDto): Promise<StartPaymentResponseDto> {
  try {
    const res = await axios.post<StartPaymentResponseDto>(`/wallet/start-payment`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function getCreditPackages(): Promise<CreditPackageResponseDto[]> {
  try {
    const res = await axios.get<CreditPackageResponseDto[]>(`/wallet/packages`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
