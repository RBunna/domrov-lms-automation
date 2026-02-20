import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SQLDatabaseModule } from './database/sql-database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ClassModule } from './modules/class/class.module';
import { TeamModule } from './modules/team/team.module';
import { FileModule } from './modules/file/file.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { HttpModule, HttpService } from '@nestjs/axios';
import { PaymentService } from './services/payment.service';
import { WalletModule } from './modules/wallet/wallet.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { RedisService } from './modules/tasks/redis.service';
import { PaymentGateway } from './modules/wallet/payment.gateway';
import { PaymentFlowService } from './modules/wallet/payment-flow.service';
// import { PaymentController } from './services/payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../libs/entities/ai/payment.entity';
import { TokenPackage } from '../libs/entities/ai/token-package.entity';
import { UserTokenBalance } from '../libs/entities/ai/user-token-balance.entity';
import { WalletTransaction } from '../libs/entities/ai/wallet-transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    SQLDatabaseModule,
    AuthModule,
    UserModule,
    ClassModule,
    TeamModule,
    FileModule,
    AssessmentModule,
    HttpModule,
    WalletModule,
    EvaluationModule,
    TasksModule,
    TypeOrmModule.forFeature([Payment, TokenPackage, UserTokenBalance, WalletTransaction]),
  ],
  
  controllers: [AppController],
  providers: [AppService,PaymentService, RedisService,PaymentFlowService,PaymentGateway],
  exports:[AppService]
})
export class AppModule { }
