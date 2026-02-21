import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentFlowService } from './payment-flow.service';
import { StartPaymentDto } from '../../libs/dtos/wallet/start-payment.dto';
import { UserId } from '../../common/decorators/user.decorator';
import { ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'dgram';


@ApiTags('Payment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentFlowService,
  ) { }

  @Post('start-payment/:packageId')
  async startPaymentEndpoint(
    @Param('packageId') packageId: number,
    @UserId() userId: number, // Using your custom decorator
  ) {
    const payment = await this.paymentService.startPayment(userId, Number(packageId));
    return payment;
  }
}
