import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Services
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AdminWalletController } from './admin-wallet.controller';
import { TokenPackageService } from './token-package.service';
import { UserTokenBalance } from '../../../libs/entities/ai/user-token-balance.entity';
import { TokenPackage } from '../../../libs/entities/ai/token-package.entity';
import { WalletTransaction } from '../../../libs/entities/ai/wallet-transaction.entity';
import { Payment } from '../../../libs/entities/ai/payment.entity';
import { PaymentController } from './payment.controller';
import { PaymentFlowService } from './payment-flow.service';
import { PaymentGateway } from './payment.gateway';
import { User } from '../../../libs/entities/user/user.entity';
import { PaymentService } from '../../services/payment.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserTokenBalance,
      WalletTransaction,
      TokenPackage,
      Payment,
      User,
    ]),HttpModule
  ],
  controllers: [WalletController, AdminWalletController, PaymentController],
  providers: [
    WalletService,
    TokenPackageService,PaymentGateway,PaymentFlowService,PaymentService
  ],
  exports: [WalletService],
})
export class WalletModule {}