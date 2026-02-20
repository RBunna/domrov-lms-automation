import {
  Injectable,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentGateway } from './payment.gateway';
import { PaymentService } from '../../services/payment.service';
import { Payment } from '../../../libs/entities/ai/payment.entity';
import { TokenPackage } from '../../../libs/entities/ai/token-package.entity';
import { UserTokenBalance } from '../../../libs/entities/ai/user-token-balance.entity';
import {
  TransactionType,
  WalletTransaction,
} from '../../../libs/entities/ai/wallet-transaction.entity';
import { PaymentStatus } from '../../../libs/enums/Status';
import { Currency, PaymentMethod } from '../../../libs/enums/Payment'; // Ensure these are imported
import { PaymentNotifier } from '../../../libs/interfaces/payment-notifier';
// import { RedisService } from '../tasks/redis.service';

@Injectable()
export class PaymentFlowService implements OnModuleInit {
  private readonly logger = new Logger(PaymentFlowService.name);
  
  constructor(
    private readonly paymentService: PaymentService,
    private readonly gateway: PaymentGateway,
    // private readonly redis: RedisService,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(TokenPackage)
    private readonly packageRepo: Repository<TokenPackage>,

    @InjectRepository(UserTokenBalance)
    private readonly balanceRepo: Repository<UserTokenBalance>,

    @InjectRepository(WalletTransaction)
    private readonly walletRepo: Repository<WalletTransaction>,
  ) { }

  // 1️⃣ Lifecycle Hook: Starts the worker safely after module loads
  onModuleInit() {
    // this.startWorker();
  }

  async startPayment(userId: number, packageId: number) {
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) throw new BadRequestException('Package not found');

    const payment = await this.paymentRepo.save({
      user: { id: userId },
      tokenPackage: { id: packageId },
      amount: pkg.price,
      currency: pkg.currency || Currency.USD,
      paymentMethod: PaymentMethod.BAKOGN,
      status: PaymentStatus.PENDING,
    });

    // Trigger async workflow
    this.handlePaymentWorkflow(payment.id, pkg.price, userId);

    return { paymentId: payment.id, message: 'Payment initiated' };
  }

  private async handlePaymentWorkflow(paymentId: number, amount: number, userId: number) {
    this.logger.log(amount)
    const qr = this.paymentService.createQR({ currency: 'USD', amount });
    const md5 = this.paymentService.generateMD5(qr);
    this.logger.log(qr)
    this.logger.log(md5)

    // Send QR via gateway
    this.gateway.sendQr(userId, qr);

    setTimeout(() => {
      this.startPolling(paymentId, md5, userId);
    }, 15000); // 15000ms = 15s
  }

  private startPolling(paymentId: number, md5: string, userId: number) {
    console.log(`Start polling payment ${paymentId} for user ${userId}`);

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

    // Stop polling automatically after 3 minutes
    setTimeout(() => {
      clearInterval(interval);
      this.gateway.sendStatus(userId, 'EXPIRED');
      console.log(`Payment ${paymentId} polling stopped after 3 minutes`);
    }, 3 * 60 * 1000);
  }

  // 3️⃣ Corrected Success Handler
  private async handleSuccess(paymentId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['tokenPackage', 'user'],
    });

    if (!payment) return;

    // Safety: Check if already completed
    if (payment.status === PaymentStatus.COMPLETED) return;

    const { tokenPackage, user } = payment;

    // Calculate
    const totalTokens =
      tokenPackage.tokenAmount + (tokenPackage.bonusTokenAmount || 0);

    // Get/Create Wallet
    let userWallet = await this.balanceRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (!userWallet) {
      // Note: We create the object, but we MUST save it before using it in the transaction relation
      userWallet = this.balanceRepo.create({
        user: user,
        tokenBalance: 0,
      });
      // Save immediately to generate the ID
      userWallet = await this.balanceRepo.save(userWallet);
    }

    // Update Balance
    userWallet.tokenBalance += totalTokens;
    await this.balanceRepo.save(userWallet);

    // Log Transaction
    await this.walletRepo.save({
      type: TransactionType.PURCHASE,
      amount: totalTokens,
      balanceAfter: userWallet.tokenBalance,
      description: `Purchased package: ${tokenPackage.name}`,
      wallet: userWallet,
      payment: payment,
    });

    // Update Payment
    payment.status = PaymentStatus.COMPLETED;
    await this.paymentRepo.save(payment);
    this.logger.log(
      `Payment ${paymentId} completed. Credited ${totalTokens} tokens.`,
    );
  }
}
