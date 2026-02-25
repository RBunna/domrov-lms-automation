// wallet.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserCreditBalance } from '../../libs/entities/ai/user-credit-balance.entity';
import { WalletTransaction, TransactionType, TransactionReason } from '../../libs/entities/ai/wallet-transaction.entity';
import { WalletBalanceResponseDto, TransactionHistoryResponseDto, WalletTransactionDto } from '../../libs/dtos/wallet/wallet.dto';
@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(UserCreditBalance)
        private readonly walletRepository: Repository<UserCreditBalance>,
        @InjectRepository(WalletTransaction)
        private readonly transactionRepository: Repository<WalletTransaction>,
        private readonly dataSource: DataSource,

    ) { }

    async getOrCreateWallet(userId: number): Promise<UserCreditBalance> {
        try {
            if (!userId) throw new BadRequestException('User ID is required');
            let wallet = await this.walletRepository.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });
            if (!wallet) {
                wallet = this.walletRepository.create({
                    user: { id: userId },
                    creditBalance: 0,
                });
                await this.walletRepository.save(wallet);
            }
            return wallet;
        } catch (err) {
            throw new BadRequestException('Failed to get or create wallet');
        }
    }

    async getBalance(userId: number): Promise<number> {
        try {
            if (!userId) throw new BadRequestException('User ID is required');
            const wallet = await this.getOrCreateWallet(userId);
            return wallet.creditBalance;
        } catch (err) {
            throw new BadRequestException('Failed to get wallet balance');
        }
    }

    async addCredits(
        userId: number,
        amount: number,
        reason: TransactionReason,
        description?: string,
    ): Promise<UserCreditBalance> {
        try {
            if (!userId) throw new BadRequestException('User ID is required');
            if (typeof amount !== 'number' || amount <= 0) throw new BadRequestException('Amount must be a positive number');
            if (!reason) throw new BadRequestException('Transaction reason is required');
            return await this.dataSource.transaction(async (manager) => {
                const wallet = await this.getOrCreateWallet(userId);
                const balanceBefore = wallet.creditBalance;
                const balanceAfter = balanceBefore + amount;
                wallet.creditBalance = balanceAfter;
                await manager.save(wallet);
                const transaction = this.transactionRepository.create({
                    walletId: wallet.id,
                    amount,
                    type: TransactionType.CREDIT,
                    reason,
                    balanceBefore,
                    balanceAfter,
                    description: description || `Added ${amount} credits`,
                });
                await manager.save(transaction);
                return wallet;
            });
        } catch (err) {
            throw new BadRequestException('Failed to add credits');
        }
    }

    async deductCredits(
        userId: number,
        amount: number,
        reason: TransactionReason,
        description?: string,
        tpye: TransactionType = TransactionType.DEBIT,
        metadata?: Record<string, any>,
    ): Promise<UserCreditBalance> {
        try {
            if (!userId) throw new BadRequestException('User ID is required');
            if (typeof amount !== 'number' || amount <= 0) throw new BadRequestException('Amount must be a positive number');
            if (!reason) throw new BadRequestException('Transaction reason is required');
            return await this.dataSource.transaction(async (manager) => {
                const wallet = await this.getOrCreateWallet(userId);
                const balanceBefore = wallet.creditBalance;
                if (balanceBefore < amount) {
                    throw new BadRequestException('Insufficient credit balance');
                }
                const balanceAfter = balanceBefore - amount;
                wallet.creditBalance = balanceAfter;
                await manager.save(wallet);
                const transaction = this.transactionRepository.create({
                    walletId: wallet.id,
                    amount,
                    type: tpye,
                    reason,
                    balanceBefore,
                    balanceAfter,
                    description: description || `Deducted ${amount} credits`,
                });
                await manager.save(transaction);
                return wallet;
            });
        } catch (err) {
            throw new BadRequestException('Failed to deduct credits');
        }
    }

    async hasEnoughBalance(userId: number, amount: number): Promise<boolean> {
        try {
            if (!userId) throw new BadRequestException('User ID is required');
            if (typeof amount !== 'number' || amount < 0) throw new BadRequestException('Amount must be a non-negative number');
            const balance = await this.getBalance(userId);
            return balance >= amount;
        } catch (err) {
            throw new BadRequestException('Failed to check balance');
        }
    }

    async getTransactionHistory(
        userId: number,
        page: number = 1,
        limit: number = 10,
    ): Promise<TransactionHistoryResponseDto> {
        try {
            if (!userId) throw new BadRequestException('User ID is required');
            if (typeof page !== 'number' || page < 1) throw new BadRequestException('Page must be a positive integer');
            if (typeof limit !== 'number' || limit < 1) throw new BadRequestException('Limit must be a positive integer');
            const wallet = await this.getOrCreateWallet(userId);
            const [transactions, total] = await this.transactionRepository.findAndCount({
                where: { walletId: wallet.id },
                order: { created_at: 'DESC' },
                skip: (page - 1) * limit,
                take: limit,
            });
            const transactionDtos: WalletTransactionDto[] = transactions.map((transaction) => ({
                id: transaction.id,
                walletId: transaction.walletId!,
                amount: transaction.amount,
                type: transaction.type,
                reason: transaction.reason,
                balanceBefore: transaction.balanceBefore,
                balanceAfter: transaction.balanceAfter,
                description: transaction.description,
                created_at: transaction.created_at,
                updatedAt: transaction.updated_at,
            }));
            return {
                data: transactionDtos,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (err) {
            throw new BadRequestException('Failed to get transaction history');
        }
    }
}