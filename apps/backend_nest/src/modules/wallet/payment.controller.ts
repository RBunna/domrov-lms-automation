import {
  Controller,
  Post,
  Body,
  UseGuards,
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
import { StartPaymentDto } from '../../../libs/dtos/wallet/start-payment.dto';
import { UserId } from '../../common/decorators/user.decorator';


@ApiTags('Payment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly flowService: PaymentFlowService,
  ) {}

  // ============================
  // Start Payment Flow
  // ============================

  @Post('start')
  @ApiOperation({
    summary: 'Start payment flow for a package',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment started successfully',
  })
  async startPayment(
    @UserId() userId: number,
    @Body() dto: StartPaymentDto,
  ) {
      if (!userId) {
    throw new UnauthorizedException('Invalid token');
  }
    return this.flowService.startPayment(
      userId,
      dto.packageId,
    );
  }
}
