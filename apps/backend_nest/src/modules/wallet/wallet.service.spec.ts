import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Repository, DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { WalletService } from './wallet.service';
import { UserCreditBalance } from '../../libs/entities/ai/user-credit-balance.entity';
import { WalletTransaction, TransactionType, TransactionReason } from '../../libs/entities/ai/wallet-transaction.entity';
import { TransactionHistoryResponseDto, WalletTransactionDto } from '../../libs/dtos/wallet/wallet.dto';

describe('WalletService', () => {
    let walletService: WalletService;
    let walletRepositoryMock: jest.Mocked<Repository<UserCreditBalance>>;
    let transactionRepositoryMock: jest.Mocked<Repository<WalletTransaction>>;
    let dataSourceMock: jest.Mocked<DataSource>;

    const testDate = new Date('2024-01-01T10:00:00.000Z');

    const mockExistingWallet: UserCreditBalance = {
        id: 10,
        user: { id: 1 } as any,
        creditBalance: 100,
    } as UserCreditBalance;

    const mockNewWalletBase: UserCreditBalance = {
        id: 999,
        user: { id: 1 } as any,
        creditBalance: 0,
    } as UserCreditBalance;

    const mockTransaction1: WalletTransaction = {
        id: 101,
        walletId: 10,
        amount: 50,
        type: TransactionType.CREDIT,
        reason: TransactionReason.PURCHASE,
        balanceBefore: 100,
        balanceAfter: 150,
        description: 'Added 50 credits',
        created_at: testDate,
        updated_at: testDate,
    } as WalletTransaction;

    const mockTransaction2: WalletTransaction = {
        id: 102,
        walletId: 10,
        amount: 20,
        type: TransactionType.DEBIT,
        reason: TransactionReason.AI_USAGE,
        balanceBefore: 150,
        balanceAfter: 130,
        description: 'Deducted 20 credits',
        created_at: new Date('2024-01-02T10:00:00.000Z'),
        updated_at: new Date('2024-01-02T10:00:00.000Z'),
    } as WalletTransaction;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WalletService,
                {
                    provide: getRepositoryToken(UserCreditBalance),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(WalletTransaction),
                    useValue: {
                        findAndCount: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        transaction: jest.fn(),
                    },
                },
            ],
        }).compile();

        walletService = module.get<WalletService>(WalletService);
        walletRepositoryMock = module.get(getRepositoryToken(UserCreditBalance)) as jest.Mocked<Repository<UserCreditBalance>>;
        transactionRepositoryMock = module.get(getRepositoryToken(WalletTransaction)) as jest.Mocked<Repository<WalletTransaction>>;
        dataSourceMock = module.get(DataSource) as jest.Mocked<DataSource>;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getOrCreateWallet', () => {
        it('WALLET_GETORCREATEWALLET_EXISTING_001 - returns existing wallet for valid userId', async () => {
            walletRepositoryMock.findOne.mockResolvedValue(mockExistingWallet);

            const result = await walletService.getOrCreateWallet(1);

            expect(result).toEqual(mockExistingWallet);
            expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
                where: { user: { id: 1 } },
                relations: ['user'],
            });
            expect(walletRepositoryMock.create).not.toHaveBeenCalled();
            expect(walletRepositoryMock.save).not.toHaveBeenCalled();
        });

        it('WALLET_GETORCREATEWALLET_NEW_002 - creates and returns new wallet when none exists', async () => {
            walletRepositoryMock.findOne.mockResolvedValue(null);
            const createdWallet = { ...mockNewWalletBase, id: 999 };
            walletRepositoryMock.create.mockReturnValue(createdWallet);
            walletRepositoryMock.save.mockResolvedValue(createdWallet);

            const result = await walletService.getOrCreateWallet(1);

            expect(result).toEqual(createdWallet);
            expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
                where: { user: { id: 1 } },
                relations: ['user'],
            });
            expect(walletRepositoryMock.create).toHaveBeenCalledWith({
                user: { id: 1 },
                creditBalance: 0,
            });
            expect(walletRepositoryMock.save).toHaveBeenCalledWith(createdWallet);
        });

        it('WALLET_GETORCREATEWALLET_INVALID_USERID_003 - throws BadRequestException when userId is falsy', async () => {
            await expect(walletService.getOrCreateWallet(0)).rejects.toThrow(
                new BadRequestException('User ID is required')
            );
            await expect(walletService.getOrCreateWallet(undefined as any)).rejects.toThrow(
                new BadRequestException('User ID is required')
            );
        });

        it('WALLET_GETORCREATEWALLET_FINDERROR_004 - throws BadRequestException on repository findOne error', async () => {
            walletRepositoryMock.findOne.mockRejectedValue(new Error('DB connection failed'));

            await expect(walletService.getOrCreateWallet(1)).rejects.toThrow(
                new BadRequestException('Failed to get or create wallet')
            );
        });

        it('WALLET_GETORCREATEWALLET_SAVEERROR_005 - throws BadRequestException on repository save error for new wallet', async () => {
            walletRepositoryMock.findOne.mockResolvedValue(null);
            const createdWallet = { ...mockNewWalletBase };
            walletRepositoryMock.create.mockReturnValue(createdWallet);
            walletRepositoryMock.save.mockRejectedValue(new Error('Save failed'));

            await expect(walletService.getOrCreateWallet(1)).rejects.toThrow(
                new BadRequestException('Failed to get or create wallet')
            );
        });
    });

    describe('getBalance', () => {
        it('WALLET_GETBALANCE_VALID_001 - returns correct balance for existing wallet', async () => {
            const walletWithBalance = { ...mockExistingWallet, creditBalance: 250 };
            walletRepositoryMock.findOne.mockResolvedValue(walletWithBalance);

            const result = await walletService.getBalance(1);

            expect(result).toEqual(250);
            expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
                where: { user: { id: 1 } },
                relations: ['user'],
            });
        });

        it('WALLET_GETBALANCE_NEW_002 - returns 0 for newly created wallet', async () => {
            walletRepositoryMock.findOne.mockResolvedValue(null);
            const createdWallet = { ...mockNewWalletBase, id: 999 };
            walletRepositoryMock.create.mockReturnValue(createdWallet);
            walletRepositoryMock.save.mockResolvedValue(createdWallet);

            const result = await walletService.getBalance(1);

            expect(result).toEqual(0);
        });

        it('WALLET_GETBALANCE_INVALID_USERID_003 - throws BadRequestException when userId is falsy', async () => {
            await expect(walletService.getBalance(0)).rejects.toThrow(
                new BadRequestException('User ID is required')
            );
        });

        it('WALLET_GETBALANCE_ERROR_004 - throws BadRequestException on underlying error', async () => {
            walletRepositoryMock.findOne.mockRejectedValue(new Error('DB error'));

            await expect(walletService.getBalance(1)).rejects.toThrow(
                new BadRequestException('Failed to get wallet balance')
            );
        });
    });

    describe('addCredits', () => {
        const mockManager = {
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
        };

        it('WALLET_ADDCREDITS_VALID_001 - successfully adds credits, updates balance, creates CREDIT transaction', async () => {
            walletRepositoryMock.findOne.mockResolvedValue({ ...mockExistingWallet });
            dataSourceMock.transaction.mockImplementation(async (cb: any) => cb(mockManager));

            const result = await walletService.addCredits(1, 50, TransactionReason.PURCHASE, 'Test description');

            expect(result).toEqual({ ...mockExistingWallet, creditBalance: 150 });
            expect(walletRepositoryMock.findOne).toHaveBeenCalledWith({
                where: { user: { id: 1 } },
                relations: ['user'],
            });
            expect(dataSourceMock.transaction).toHaveBeenCalled();
            expect(transactionRepositoryMock.create).toHaveBeenCalledWith({
                walletId: 10,
                amount: 50,
                type: TransactionType.CREDIT,
                reason: TransactionReason.PURCHASE,
                balanceBefore: 100,
                balanceAfter: 150,
                description: 'Test description',
            });
            expect(mockManager.save).toHaveBeenCalledTimes(2);
        });

        it('WALLET_ADDCREDITS_NEW_WALLET_002 - creates new wallet (balance 0) then adds credits', async () => {
            walletRepositoryMock.findOne.mockResolvedValue(null);
            const createdWallet = { ...mockNewWalletBase, id: 999 };
            walletRepositoryMock.create.mockReturnValue(createdWallet);
            walletRepositoryMock.save.mockResolvedValue(createdWallet);
            dataSourceMock.transaction.mockImplementation(async (cb: any) => cb(mockManager));

            const result = await walletService.addCredits(1, 75, TransactionReason.BONUS);

            expect(result).toEqual({ ...createdWallet, creditBalance: 75 });
            expect(walletRepositoryMock.create).toHaveBeenCalled();
            expect(walletRepositoryMock.save).toHaveBeenCalled(); // from getOrCreate
            expect(transactionRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                balanceBefore: 0,
                balanceAfter: 75,
                type: TransactionType.CREDIT,
            }));
        });

        it('WALLET_ADDCREDITS_INVALID_USERID_003 - throws BadRequestException for missing userId', async () => {
            await expect(walletService.addCredits(0, 10, TransactionReason.PURCHASE)).rejects.toThrow(
                new BadRequestException('User ID is required')
            );
        });

        it('WALLET_ADDCREDITS_INVALID_AMOUNT_ZERO_004 - throws BadRequestException for amount <= 0', async () => {
            await expect(walletService.addCredits(1, 0, TransactionReason.PURCHASE)).rejects.toThrow(
                new BadRequestException('Amount must be a positive number')
            );
            await expect(walletService.addCredits(1, -5, TransactionReason.PURCHASE)).rejects.toThrow(
                new BadRequestException('Amount must be a positive number')
            );
        });

        it('WALLET_ADDCREDITS_INVALID_REASON_005 - throws BadRequestException for missing reason', async () => {
            await expect(walletService.addCredits(1, 10, undefined as any)).rejects.toThrow(
                new BadRequestException('Transaction reason is required')
            );
        });

        it('WALLET_ADDCREDITS_TX_ERROR_006 - throws generic BadRequestException on transaction failure', async () => {
            walletRepositoryMock.findOne.mockResolvedValue({ ...mockExistingWallet });
            dataSourceMock.transaction.mockRejectedValue(new Error('Transaction failed'));

            await expect(walletService.addCredits(1, 10, TransactionReason.PURCHASE)).rejects.toThrow(
                new BadRequestException('Failed to add credits')
            );
        });
    });

    describe('deductCredits', () => {
        const mockManager = {
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
        };

        it('WALLET_DEDUCTCREDITS_VALID_DEFAULTTYPE_001 - successfully deducts credits using default DEBIT type', async () => {
            const wallet = { ...mockExistingWallet, creditBalance: 200 };
            walletRepositoryMock.findOne.mockResolvedValue(wallet);
            dataSourceMock.transaction.mockImplementation(async (cb: any) => cb(mockManager));

            const result = await walletService.deductCredits(1, 45, TransactionReason.AI_USAGE, 'AI usage');

            expect(result).toEqual({ ...wallet, creditBalance: 155 });
            expect(transactionRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                type: TransactionType.DEBIT,
                balanceBefore: 200,
                balanceAfter: 155,
            }));
        });

        it('WALLET_DEDUCTCREDITS_VALID_CUSTOMTYPE_002 - successfully deducts with explicit PURCHASE type', async () => {
            const wallet = { ...mockExistingWallet, creditBalance: 200 };
            walletRepositoryMock.findOne.mockResolvedValue(wallet);
            dataSourceMock.transaction.mockImplementation(async (cb: any) => cb(mockManager));

            const result = await walletService.deductCredits(1, 45, TransactionReason.AI_USAGE, 'AI usage', TransactionType.PURCHASE);

            expect(result).toEqual({ ...wallet, creditBalance: 155 });
            expect(transactionRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                type: TransactionType.PURCHASE,
            }));
        });

        it('WALLET_DEDUCTCREDITS_INSUFFICIENT_003 - throws generic BadRequestException on insufficient balance', async () => {
            const wallet = { ...mockExistingWallet, creditBalance: 10 };
            walletRepositoryMock.findOne.mockResolvedValue(wallet);
            dataSourceMock.transaction.mockImplementation(async (cb: any) => cb(mockManager));

            await expect(walletService.deductCredits(1, 50, TransactionReason.AI_USAGE)).rejects.toThrow(
                new BadRequestException('Failed to deduct credits')
            );
        });

        it('WALLET_DEDUCTCREDITS_INVALID_USERID_004 - throws BadRequestException for missing userId', async () => {
            await expect(walletService.deductCredits(0, 10, TransactionReason.AI_USAGE)).rejects.toThrow(
                new BadRequestException('User ID is required')
            );
        });

        it('WALLET_DEDUCTCREDITS_INVALID_AMOUNT_005 - throws BadRequestException for amount <= 0', async () => {
            await expect(walletService.deductCredits(1, 0, TransactionReason.AI_USAGE)).rejects.toThrow(
                new BadRequestException('Amount must be a positive number')
            );
        });

        it('WALLET_DEDUCTCREDITS_INVALID_REASON_006 - throws BadRequestException for missing reason', async () => {
            await expect(walletService.deductCredits(1, 10, undefined as any)).rejects.toThrow(
                new BadRequestException('Transaction reason is required')
            );
        });

        it('WALLET_DEDUCTCREDITS_TX_ERROR_007 - throws generic BadRequestException on transaction failure', async () => {
            walletRepositoryMock.findOne.mockResolvedValue({ ...mockExistingWallet });
            dataSourceMock.transaction.mockRejectedValue(new Error('TX error'));

            await expect(walletService.deductCredits(1, 10, TransactionReason.AI_USAGE)).rejects.toThrow(
                new BadRequestException('Failed to deduct credits')
            );
        });
    });

    describe('hasEnoughBalance', () => {
        it('WALLET_HASENOUGHBALANCE_VALID_ENOUGH_001 - returns true when balance >= amount', async () => {
            walletRepositoryMock.findOne.mockResolvedValue({ ...mockExistingWallet, creditBalance: 150 });

            const result = await walletService.hasEnoughBalance(1, 100);

            expect(result).toEqual(true);
        });

        it('WALLET_HASENOUGHBALANCE_VALID_NOTENOUGH_002 - returns false when balance < amount', async () => {
            walletRepositoryMock.findOne.mockResolvedValue({ ...mockExistingWallet, creditBalance: 50 });

            const result = await walletService.hasEnoughBalance(1, 100);

            expect(result).toEqual(false);
        });

        it('WALLET_HASENOUGHBALANCE_AMOUNT_ZERO_003 - returns true for amount 0', async () => {
            walletRepositoryMock.findOne.mockResolvedValue({ ...mockExistingWallet, creditBalance: 0 });

            const result = await walletService.hasEnoughBalance(1, 0);

            expect(result).toEqual(true);
        });

        it('WALLET_HASENOUGHBALANCE_INVALID_USERID_004 - throws BadRequestException for missing userId', async () => {
            await expect(walletService.hasEnoughBalance(0, 10)).rejects.toThrow(
                new BadRequestException('User ID is required')
            );
        });

        it('WALLET_HASENOUGHBALANCE_INVALID_AMOUNT_NEG_005 - throws BadRequestException for negative amount', async () => {
            await expect(walletService.hasEnoughBalance(1, -5)).rejects.toThrow(
                new BadRequestException('Amount must be a non-negative number')
            );
        });

        it('WALLET_HASENOUGHBALANCE_ERROR_006 - throws BadRequestException on underlying error', async () => {
            walletRepositoryMock.findOne.mockRejectedValue(new Error('DB error'));

            await expect(walletService.hasEnoughBalance(1, 10)).rejects.toThrow(
                new BadRequestException('Failed to check balance')
            );
        });
    });

    describe('getTransactionHistory', () => {
        it('WALLET_GETTRANSACTIONHISTORY_VALID_001 - returns paginated history with correct DTO mapping and meta', async () => {
            walletRepositoryMock.findOne.mockResolvedValue(mockExistingWallet);
            transactionRepositoryMock.findAndCount.mockResolvedValue([[mockTransaction1, mockTransaction2], 2]);

            const result = await walletService.getTransactionHistory(1, 1, 10);

            const expected: TransactionHistoryResponseDto = {
                data: [
                    {
                        id: 101,
                        walletId: 10,
                        amount: 50,
                        type: TransactionType.CREDIT,
                        reason: TransactionReason.PURCHASE,
                        balanceBefore: 100,
                        balanceAfter: 150,
                        description: 'Added 50 credits',
                        created_at: testDate,
                    },
                    {
                        id: 102,
                        walletId: 10,
                        amount: 20,
                        type: TransactionType.DEBIT,
                        reason: TransactionReason.AI_USAGE,
                        balanceBefore: 150,
                        balanceAfter: 130,
                        description: 'Deducted 20 credits',
                        created_at: new Date('2024-01-02T10:00:00.000Z'),
                    },
                ],
                meta: {
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            };
            expect(result).toEqual(expected);
            expect(transactionRepositoryMock.findAndCount).toHaveBeenCalledWith({
                where: { walletId: 10 },
                order: { created_at: 'DESC' },
                skip: 0,
                take: 10,
            });
        });

        it('WALLET_GETTRANSACTIONHISTORY_EMPTY_002 - returns empty data and correct meta for no transactions', async () => {
            walletRepositoryMock.findOne.mockResolvedValue(mockExistingWallet);
            transactionRepositoryMock.findAndCount.mockResolvedValue([[], 0]);

            const result = await walletService.getTransactionHistory(1, 2, 5);

            const expected: TransactionHistoryResponseDto = {
                data: [],
                meta: {
                    total: 0,
                    page: 2,
                    limit: 5,
                    totalPages: 0,
                },
            };
            expect(result).toEqual(expected);
        });

        it('WALLET_GETTRANSACTIONHISTORY_INVALID_USERID_003 - throws BadRequestException for missing userId', async () => {
            await expect(walletService.getTransactionHistory(0)).rejects.toThrow(
                new BadRequestException('User ID is required')
            );
        });

        it('WALLET_GETTRANSACTIONHISTORY_INVALID_PAGE_004 - throws BadRequestException for invalid page', async () => {
            await expect(walletService.getTransactionHistory(1, 0)).rejects.toThrow(
                new BadRequestException('Page must be a positive integer')
            );
            await expect(walletService.getTransactionHistory(1, -1)).rejects.toThrow(
                new BadRequestException('Page must be a positive integer')
            );
        });

        it('WALLET_GETTRANSACTIONHISTORY_INVALID_LIMIT_005 - throws BadRequestException for invalid limit', async () => {
            await expect(walletService.getTransactionHistory(1, 1, 0)).rejects.toThrow(
                new BadRequestException('Limit must be a positive integer')
            );
        });

        it('WALLET_GETTRANSACTIONHISTORY_ERROR_006 - throws BadRequestException on repository error', async () => {
            walletRepositoryMock.findOne.mockResolvedValue(mockExistingWallet);
            transactionRepositoryMock.findAndCount.mockRejectedValue(new Error('DB error'));

            await expect(walletService.getTransactionHistory(1)).rejects.toThrow(
                new BadRequestException('Failed to get transaction history')
            );
        });
    });
});