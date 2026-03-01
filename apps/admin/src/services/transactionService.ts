// Transaction Service

import { apiClient } from './api';

export interface Transaction {
    id: number;
    user: string;
    userId: number;
    amount: number;
    currency: string;
    method: string;
    status: 'paid' | 'unpaid';
    date: string;
    userNote?: string | null;
    proofImageUrl?: string | null;
    verificationNote?: string | null;
}

export interface TransactionDetail {
    id: number;
    user: string;
    userId: number;
    amount: number;
    currency: string;
    method: string;
    status: 'paid' | 'unpaid';
    date: string;
    transactionDetails: any;
}

export interface TransactionListResponse {
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
}

class TransactionService {
    async fetchTransactions(page: number = 1, limit: number = 10, status?: string, search?: string): Promise<TransactionListResponse> {
        try {
            // API returns { success: true, data: { data: [...items], total, page, limit } }
            // request function automatically unwraps to { data: [...items], total, page, limit }
            const response = await apiClient.transactions.getAll(page, limit, status, search);
            // For paginated responses, items are in response.data
            const itemsData = response.data || [];

            const transactions: Transaction[] = itemsData.map((t: any) => ({
                id: t.id,
                user: t.user,
                userId: t.userId,
                amount: t.amount,
                currency: t.currency,
                method: t.method,
                status: t.status as 'paid' | 'unpaid',
                date: t.date,
                userNote: t.userNote,
                proofImageUrl: t.proofImageUrl,
                verificationNote: t.verificationNote,
            }));
            return {
                data: transactions,
                total: response.total || 0,
                page: response.page || 1,
                limit: response.limit || 10,
            };
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            throw error;
        }
    }

    async fetchTransactionById(id: number): Promise<Transaction | null> {
        try {
            // API returns { success: true, data: { id, user, userId, ... } }
            // request function automatically unwraps to { id, user, userId, ... }
            const response = await apiClient.transactions.getById(id);
            return response as Transaction;
        } catch (error) {
            console.error(`Failed to fetch transaction ${id}:`, error);
            return null;
        }
    }

    async verifyTransaction(id: number, verificationNote?: string): Promise<any> {
        try {
            // API returns { success: true, data: { message: "..." } }
            // request function automatically unwraps to { message: "..." }
            const response = await apiClient.transactions.markAsPaid(id, verificationNote);
            return response;
        } catch (error) {
            console.error(`Failed to verify transaction ${id}:`, error);
            throw error;
        }
    }

    async failTransaction(id: number, reason: string = 'Rejected by admin', note?: string): Promise<any> {
        try {
            // API returns { success: true, data: { message: "..." } }
            // request function automatically unwraps to { message: "..." }
            const response = await apiClient.transactions.reject(id, reason, note);
            return response;
        } catch (error) {
            console.error(`Failed to reject transaction ${id}:`, error);
            throw error;
        }
    }

    async verifyByHash(transactionHash: string, amount: number, userId: number): Promise<any> {
        try {
            // API returns { success: true, data: { message: "..." } }
            // request function automatically unwraps to { message: "..." }
            const response = await apiClient.transactions.verifyByHash(transactionHash, amount, userId);
            return response;
        } catch (error) {
            console.error('Failed to verify transaction by hash:', error);
            throw error;
        }
    }
}

export const transactionService = new TransactionService();
