import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'SUBMISSION_PACKAGE',
        imports: [],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'submission',
            protoPath: './src/protos/submission.proto',
            url: `${configService.get('CODE_EVAL_GRPC_CLIENT_HOST')}:${configService.get('CODE_EVAL_GRPC_CLIENT_PORT')}`,
            loader: { keepCase: true },
          },
        }),
      },
    ]),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule { }
