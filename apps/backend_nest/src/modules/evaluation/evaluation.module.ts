import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
    ClientsModule.register([
      {
        name: 'SUBMISSION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'submission',
          protoPath:  './src/protos/submission.proto',
          url: 'localhost:50051',
          loader: { keepCase: true },
        },
      },
    ]),
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}
