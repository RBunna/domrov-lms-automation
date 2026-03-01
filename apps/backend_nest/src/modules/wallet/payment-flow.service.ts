// payment-flow.service.ts (updated to use float numbers instead of string)
import { Injectable, BadRequestException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentGateway } from './payment.gateway';
import { PaymentService, TransactionData } from '../../services/payment.service';
import { Payment } from '../../libs/entities/ai/payment.entity';
import { CreditPackage } from '../../libs/entities/ai/credit-package.entity';
import { UserCreditBalance } from '../../libs/entities/ai/user-credit-balance.entity';
import {
  TransactionType,
  TransactionReason,
  WalletTransaction,
} from '../../libs/entities/ai/wallet-transaction.entity';
import { PaymentStatus } from '../../libs/enums/Status';
import { Currency, PaymentMethod } from '../../libs/enums/Payment';
import { StartPaymentResponseDto } from '../../libs/dtos/wallet/start-payment-response.dto';

@Injectable()
export class PaymentFlowService implements OnModuleInit {
  private readonly logger = new Logger(PaymentFlowService.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly gateway: PaymentGateway,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(CreditPackage)
    private readonly packageRepo: Repository<CreditPackage>,

    @InjectRepository(UserCreditBalance)
    private readonly balanceRepo: Repository<UserCreditBalance>,

    @InjectRepository(WalletTransaction)
    private readonly walletRepo: Repository<WalletTransaction>,
  ) { }

  onModuleInit() { }

  async startPayment(userId: number, packageId: number): Promise<StartPaymentResponseDto> {
    try {
      if (!userId) throw new BadRequestException('User ID is required');
      if (!packageId) throw new BadRequestException('Package ID is required');
      const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
      if (!pkg) {
        throw new NotFoundException('Credit package not found');
      }
      const payment = await this.paymentRepo.save({
        user: { id: userId },
        creditPackage: { id: packageId },
        amount: pkg.price,
        currency: pkg.currency || Currency.USD,
        paymentMethod: PaymentMethod.BAKOGN,
        status: PaymentStatus.PENDING,
      });
      this.handlePaymentWorkflow(payment.id, pkg.price, userId);
      return { paymentId: payment.id, message: 'Payment initiated' };
    } catch (err) {
      throw err instanceof NotFoundException || err instanceof BadRequestException ? err : new BadRequestException('Failed to start payment');
    }
  }

  private async handlePaymentWorkflow(paymentId: number, amount: number, userId: number) {
    try {
      if (!paymentId || !userId || typeof amount !== 'number' || amount <= 0) throw new BadRequestException('Invalid payment workflow parameters');
      this.logger.log(amount);
      const qr = this.paymentService.createQR({ currency: 'USD', amount });
      const md5 = this.paymentService.generateMD5(qr);
      this.logger.log(qr);
      this.logger.log(md5);
      this.gateway.sendQr(userId, qr);
      void this.startPaymentPolling(paymentId, md5, userId);
    } catch (err) {
      this.logger.error('Failed to handle payment workflow', err);
    }
  }

  async startPaymentPolling(paymentId: number, md5: string, userId: number) {
    try {
      if (!paymentId || !md5 || !userId) throw new BadRequestException('Invalid polling parameters');
      await this.sleep(15000);
      const timeoutMs = 3 * 60 * 1000; // 3 minutes
      const intervalMs = 5000;
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        try {
          const response = await this.paymentService.checkPayment(md5);
          this.gateway.sendStatus(userId, response.responseCode === 0 ? 'PAID' : 'UNPAID');
          if (response.responseCode === 0) {
            await this.handleSuccess(paymentId);
            return;
          }
        } catch (err) {
          this.logger.error(`Polling error for payment ${paymentId}:`, err);
        }
        await this.sleep(intervalMs);
      }
      this.gateway.sendStatus(userId, 'EXPIRED');
    } catch (err) {
      this.logger.error('Failed to start payment polling', err);
    }
  }

  private async handleSuccess(paymentId: number, paymentData?: TransactionData) {
    try {
      if (!paymentId) throw new BadRequestException('Payment ID is required');
      const payment = await this.paymentRepo.findOne({
        where: { id: paymentId },
        relations: ['creditPackage', 'user'],
      });
      if (!payment || payment.status === PaymentStatus.COMPLETED) return;
      const { creditPackage, user } = payment;
      if (!creditPackage || !user) throw new BadRequestException('Invalid payment data');
      const totalCredits = creditPackage.credits + (creditPackage.bonusCredits || 0);
      let userWallet = await this.balanceRepo.findOne({
        where: { user: { id: user.id } },
        relations: ['user'],
      });
      if (!userWallet) {
        userWallet = this.balanceRepo.create({
          user,
          creditBalance: 0,
        });
        userWallet = await this.balanceRepo.save(userWallet);
      }
      const balanceBefore = userWallet.creditBalance;
      const balanceAfter = balanceBefore + totalCredits;
      userWallet.creditBalance = balanceAfter;
      await this.balanceRepo.save(userWallet);
      await this.walletRepo.save({
        wallet: userWallet,
        type: TransactionType.CREDIT,
        reason: TransactionReason.PURCHASE,
        amount: totalCredits,
        balanceBefore,
        balanceAfter,
        description: `Purchased credit package: ${creditPackage.name}`,
        metadata: { paymentId: payment.id, packageId: creditPackage.id },
      });
      //payment data store
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionId = paymentData.hash;
      payment.transactionDetails = paymentData;
      await this.paymentRepo.save(payment);
      this.logger.log(
        `Payment ${paymentId} completed. Credited ${totalCredits} credits to user ${user.id}.`,
      );
    } catch (err) {
      this.logger.error('Failed to handle payment success', err);
    }
  }
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async verifyTransactionByHash(hash: string, amount: number, currency: string, userId: number): Promise<any> {
    try {
      if (!hash || typeof hash !== 'string' || hash.length !== 8) {
        throw new BadRequestException('Hash must be exactly 8 characters');
      }
      if (typeof amount !== 'number' || amount <= 0) {
        throw new BadRequestException('Amount must be a positive number');
      }
      if (!['USD', 'KHR'].includes(currency)) {
        throw new BadRequestException('Currency must be either USD or KHR');
      }
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      // Check if transaction with this hash already exists in database
      const existingTransaction = await this.paymentRepo.findOne({
        where: { transactionId: hash },
        relations: ['user', 'creditPackage'],
      });

      if (existingTransaction) {
        // Transaction already exists, return the stored details
        return {
          responseCode: 0,
          responseMessage: 'Transaction already verified',
          data: existingTransaction.transactionDetails,
        };
      }

      // Call the payment service to check the transaction with the Bakong API
      const response = await this.paymentService.checkPaymentByHash(hash, amount, currency as any);

      if (response.responseCode === 0 && response.data) {
        // Store the transaction details in the database
        // We can store it with the short hash for future reference
        const payment = await this.paymentRepo.findOne({
          where: { transactionId: hash },
        });

        if (!payment) {
          // Store the transaction details with the user who verified it
          await this.paymentRepo.save({
            transactionId: hash,
            amount: response.data.amount,
            currency: response.data.currency as any,
            status: PaymentStatus.COMPLETED,
            transactionDetails: response.data,
            paymentMethod: PaymentMethod.BAKOGN,
            user: { id: userId },
          });
        }
      }

      return response;
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error('Failed to verify transaction by hash', err);
      throw new BadRequestException('Failed to verify transaction');
    }
  }
}