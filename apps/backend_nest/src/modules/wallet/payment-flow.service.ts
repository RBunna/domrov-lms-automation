// payment-flow.service.ts (updated to use float numbers instead of string)
import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
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

  async startPayment(userId: number, packageId: number) {
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) throw new BadRequestException('Credit package not found');

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

    setTimeout(() => {
      this.startPolling(paymentId, md5, userId);
    }, 15000);
  }

  private startPolling(paymentId: number, md5: string, userId: number) {
    const interval = setInterval(async () => {
      try {
        const status = await this.paymentService.checkPayment(md5);
        this.gateway.sendStatus(userId, status);

        if (status === 'PAID') {
          clearInterval(interval);
          await this.handleSuccess(paymentId);
        }
      } catch (err) {
        this.logger.error(`Polling error for payment ${paymentId}:`, err);
      }
    }, 5000);

    setTimeout(() => {
      clearInterval(interval);
      this.gateway.sendStatus(userId, 'EXPIRED');
    }, 3 * 60 * 1000);
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
}