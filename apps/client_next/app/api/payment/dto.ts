// Payment DTOs

import { Currency } from '@/lib/enums/Currency';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export interface CheckTransactionByHashDto {
    hash: string;
    amount: number;
    currency: Currency;
}

export interface TransactionDataDto {
    hash: string;
    fromAccountId: string;
    toAccountId: string;
    currency: string;
    amount: number;
    description: string;
    createdDateMs: number;
    acknowledgedDateMs: number;
    trackingStatus?: string;
    receiverBank?: string;
    receiverBankAccount?: string;
}

export interface CheckTransactionResponseDto {
    responseCode: number;
    responseMessage: string;
    data?: TransactionDataDto;
    errorCode?: number;
}

export interface StartPaymentResponseDto {
    paymentId: number;
    message: string;
}
