import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminTransactionsController } from './admin-transactions.controller';
import { AdminEvaluationsController } from './admin-evaluations.controller';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../../services/payment.service';
import { User } from '../../libs/entities/user/user.entity';
import { UserCreditBalance } from '../../libs/entities/ai/user-credit-balance.entity';
import { WalletTransaction } from '../../libs/entities/ai/wallet-transaction.entity';
import { Payment } from '../../libs/entities/ai/payment.entity';
import { Submission } from '../../libs/entities/assessment/submission.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserCreditBalance,
      WalletTransaction,
      Payment,
      Submission,
    ]),
    HttpModule.register({}),
    WalletModule,
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminTransactionsController,
    AdminEvaluationsController,
  ],
  providers: [WalletService, PaymentService],
  exports: [],
})
export class AdminModule {}
