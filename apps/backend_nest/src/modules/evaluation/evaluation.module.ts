import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'CODE_EVAL_GRPC',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: `${config.get('CODE_EVAL_GRPC_CLIENT_HOST')}:${config.get('CODE_EVAL_GRPC_CLIENT_PORT')}`,
            package: 'submission', 
            protoPath: [
              '/app/shared/protos/submission.proto',
              '/app/shared/protos/tasks.proto',
            ],
            loader: {
              keepCase: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule { }
