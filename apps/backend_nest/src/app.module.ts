import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SQLDatabaseModule } from './database/sql-database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ClassModule } from './modules/class/class.module';
import { TeamModule } from './modules/team/team.module';
import { FileModule } from './modules/file/file.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './services/payment.service';
import { WalletModule } from './modules/wallet/wallet.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { RedisService } from './modules/tasks/redis.service';
import { PaymentGateway } from './modules/wallet/payment.gateway';
import { PaymentFlowService } from './modules/wallet/payment-flow.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './libs/entities/ai/payment.entity';
import { WalletTransaction } from './libs/entities/ai/wallet-transaction.entity';
import { CreditPackage } from './libs/entities/ai/credit-package.entity';
import { UserCreditBalance } from './libs/entities/ai/user-credit-balance.entity';
import { SecurityModule } from './common/security';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): CacheModuleOptions => {
        const cacheType = configService.get<string>('CACHE_TYPE', 'memory');
        if (cacheType === 'redis') {
          return {
            url: configService.get<string>('REDIS_URL'),
            ttl: 5000,
          };
        }
        // fallback memory cache
        return {
          ttl: 5000,
          max: 100,
        };
      },
    }),
    SQLDatabaseModule,
    SecurityModule,
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
    TypeOrmModule.forFeature([Payment, CreditPackage, UserCreditBalance, WalletTransaction]),
  ],
  controllers: [AppController],
  providers: [AppService, PaymentService, RedisService, PaymentFlowService, PaymentGateway],
  exports: [AppService]
})
export class AppModule { }