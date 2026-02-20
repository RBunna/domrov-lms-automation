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
// import { RedisService } from '../tasks/redis.service';

@Injectable()
export class PaymentFlowService implements OnModuleInit {
  private readonly logger = new Logger(PaymentFlowService.name);
  private QUEUE_NAME = 'payment_poll';
  // 1️⃣ In-Memory Store for Active Polls (Replaces Redis)
  // Key: PaymentID, Value: The Interval Timer
  private activePolls = new Map<number, NodeJS.Timeout>();

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
  ) {}

  // 1️⃣ Lifecycle Hook: Starts the worker safely after module loads
  onModuleInit() {
    // this.startWorker();
  }

  async startPayment(userId: number, packageId: number) {
    // A. Get package
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) throw new BadRequestException('Package not found');

    // B. Create payment record (Added missing fields)
    const payment = await this.paymentRepo.save({
      user: { id: userId },
      tokenPackage: { id: packageId },
      amount: pkg.price,
      currency: pkg.currency || Currency.USD, // Fallback if package has no currency
      paymentMethod: PaymentMethod.BAKOGN, // Assuming QR is the method
      status: PaymentStatus.PENDING,
    });

    // C. Wait 15s before QR (Simulating delay)
    // Note: This runs in background. If server restarts in these 15s, this is lost.
    setTimeout(async () => {
      // await this.generateAndQueue(payment.id, pkg.price);
      await this.generateAndStartPolling(payment.id, pkg.price);
    }, 15000);

    return {
      paymentId: payment.id,
      message: 'Payment initiated, QR coming in 15s',
    };
  }

  // private async generateAndQueue(paymentId: number, amount: number) {
  //   try {
  //     const qr = this.paymentService.createQR({ currency: 'USD', amount });
  //     const md5 = this.paymentService.generateMD5(qr);

  //     // Send QR to frontend
  //     this.gateway.sendQr(qr);

  //     // Push to Redis queue for polling
  //     await this.redis.pushToQueue(this.QUEUE_NAME, { paymentId, md5 });
  //   } catch (error) {
  //     this.logger.error(`Error generating QR for payment ${paymentId}`, error);
  //   }
  // }
  private async generateAndStartPolling(paymentId: number, amount: number) {
    try {
      console.log(amount);
      const qr = this.paymentService.createQR({ currency: 'USD', amount });
    
      const md5 = this.paymentService.generateMD5(qr);

      // Send QR to frontend
      this.gateway.sendQr(qr);
      

      // Start the 5-second interval check
      this.startPolling(paymentId, md5);
    } catch (error) {
      this.logger.error(`Error generating QR for payment ${paymentId}`, error);
    }
  }
  private startPolling(paymentId: number, md5: string) {
    this.logger.log(`Starting polling for Payment ID: ${paymentId}`);

    // Create a timer that runs every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        // Check status directly
        const status = await this.paymentService.checkPayment(md5);

        // Notify Frontend
        this.gateway.sendStatus(status);

        if (status === 'PAID') {
          // ✅ Success! Stop the timer immediately
          this.stopPolling(paymentId);
          await this.handleSuccess(paymentId);
        }
        // If status is still 'PENDING', the interval will just run again in 5s
      } catch (err) {
        this.logger.error(`Polling error for payment ${paymentId}:`, err);
      }
    }, 5000); // 5000ms = 5 seconds

    // Store the timer so we can stop it later
    this.activePolls.set(paymentId, pollInterval);

    // 🔒 Safety: Stop polling automatically after 10 minutes (Prevent memory leaks)
    setTimeout(
      () => {
        if (this.activePolls.has(paymentId)) {
          this.logger.warn(`Payment ${paymentId} timed out. Stopping polling.`);
          this.stopPolling(paymentId);
          this.gateway.sendStatus('EXPIRED');
        }
      },
      3 * 60 * 1000,
    );
  }
  private stopPolling(paymentId: number) {
    const interval = this.activePolls.get(paymentId);
    if (interval) {
      clearInterval(interval);
      this.activePolls.delete(paymentId);
    }
  }
  // private async generateAndStartPolling(paymentId: number, amount: number) {
  //   try {
  //     const qr = this.paymentService.createQR({ currency: 'USD', amount });
  //     const md5 = this.paymentService.generateMD5(qr);

  //     // Send QR to frontend
  //     this.gateway.sendQr(qr);

  //     // Start the 5-second interval check
  //     this.startPolling(paymentId, md5);
  //   } catch (error) {
  //     this.logger.error(`Error generating QR for payment ${paymentId}`, error);
  //   }
  // }

  // 2️⃣ Optimized Worker
  // private async startWorker() {
  //   this.logger.log('Payment Polling Worker Started...');

  //   while (true) {
  //     try {
  //       // Pop job
  //       const job = await this.redis.popFromQueue(this.QUEUE_NAME);

  //       if (!job) {
  //         // If queue is empty, wait 2 seconds before checking again (Save CPU)
  //         await this.sleep(2000);
  //         continue;
  //       }

  //       const { paymentId, md5 } = job;

  //       // Check status
  //       const status = await this.paymentService.checkPayment(md5);

  //       // Notify Frontend
  //       this.gateway.sendStatus(status);

  //       if (status === 'PAID') {
  //         await this.handleSuccess(paymentId);
  //       } else {
  //         // ⚠️ IMPORTANT: If still pending, wait a bit before re-queueing
  //         // to prevent spamming the checkPayment API 100 times/sec
  //         await this.sleep(3000);

  //         // Requeue
  //         await this.redis.pushToQueue(this.QUEUE_NAME, job);
  //       }
  //     } catch (err) {
  //       this.logger.error('Payment worker error:', err);
  //       // Wait on error to prevent rapid error loops
  //       await this.sleep(5000);
  //     }
  //   }
  // }

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

    this.gateway.sendStatus('PAID');
    this.logger.log(
      `Payment ${paymentId} completed. Credited ${totalTokens} tokens.`,
    );
  }

  // Helper for delays
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
