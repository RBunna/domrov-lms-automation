// wallet.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserCreditBalance } from '../../libs/entities/ai/user-credit-balance.entity';
import { WalletTransaction, TransactionType, TransactionReason } from '../../libs/entities/ai/wallet-transaction.entity';

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
    }

    async getBalance(userId: number): Promise<number> {
        const wallet = await this.getOrCreateWallet(userId);
        return wallet.creditBalance;
    }

    async addCredits(
        userId: number,
        amount: number,
        reason: TransactionReason,
        description?: string,
    ): Promise<UserCreditBalance> {
        return this.dataSource.transaction(async (manager) => {
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
    }

    async deductCredits(
        userId: number,
        amount: number,
        reason: TransactionReason,
        description?: string,
        tpye: TransactionType = TransactionType.DEBIT,
        metadata?: Record<string, any>,
    ): Promise<UserCreditBalance> {
        return this.dataSource.transaction(async (manager) => {
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
    }

    async hasEnoughBalance(userId: number, amount: number): Promise<boolean> {
        const balance = await this.getBalance(userId);
        return balance >= amount;
    }

    async getTransactionHistory(
        userId: number,
        page: number = 1,
        limit: number = 10,
    ) {
        const wallet = await this.getOrCreateWallet(userId);

        const [transactions, total] = await this.transactionRepository.findAndCount({
            where: { walletId: wallet.id },
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}