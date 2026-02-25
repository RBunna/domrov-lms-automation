// payment-flow.service.ts (updated to use float numbers instead of string)
import { Injectable, BadRequestException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentGateway } from './payment.gateway';
import { PaymentService } from '../../services/payment.service';
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
  }

  private async handlePaymentWorkflow(paymentId: number, amount: number, userId: number) {
    this.logger.log(amount);

    const qr = this.paymentService.createQR({ currency: 'USD', amount });
    const md5 = this.paymentService.generateMD5(qr);

    this.logger.log(qr);
    this.logger.log(md5);

    this.gateway.sendQr(userId, qr);

    void this.startPaymentPolling(paymentId, md5, userId);
  }

  async startPaymentPolling(paymentId: number, md5: string, userId: number) {
    // wait initial delay (15s)
    await this.sleep(15000);

    const timeoutMs = 3 * 60 * 1000; // 3 minutes
    const intervalMs = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.paymentService.checkPayment(md5);
        this.gateway.sendStatus(userId, status);

        if (status === 'PAID') {
          await this.handleSuccess(paymentId);
          return; 
        }
      } catch (err) {
        this.logger.error(`Polling error for payment ${paymentId}:`, err);
      }

      await this.sleep(intervalMs);
    }

    // expired
    this.gateway.sendStatus(userId, 'EXPIRED');
  }

  private async handleSuccess(paymentId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['creditPackage', 'user'],
    });

    if (!payment || payment.status === PaymentStatus.COMPLETED) return;

    const { creditPackage, user } = payment;

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

    payment.status = PaymentStatus.COMPLETED;
    await this.paymentRepo.save(payment);

    this.logger.log(
      `Payment ${paymentId} completed. Credited ${totalCredits} credits to user ${user.id}.`,
    );
  }
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}