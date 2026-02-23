import {
    Controller,
    Post,
    UseGuards,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';

import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentFlowService } from './payment-flow.service';
import { UserId } from '../../common/decorators/user.decorator';
import { StartPaymentResponseDto } from '../../libs/dtos/wallet/start-payment-response.dto';


@ApiTags('Payment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentFlowService,
    ) { }

    // ==================== START PAYMENT ====================
    @Post('start-payment/:packageId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Initiate payment for a credit package',
        description: 'Starts the payment flow for purchasing a credit package. A QR code will be sent via WebSocket for payment completion.'
    })
    @ApiParam({ 
        name: 'packageId', 
        type: Number, 
        description: 'ID of the credit package to purchase',
        example: 1
    })
    @ApiOkResponse({ 
        description: 'Payment initiated successfully. QR code sent via WebSocket.',
        type: StartPaymentResponseDto,
        example: {
            paymentId: 123,
            message: 'Payment initiated'
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Credit package not found',
        example: {
            statusCode: 404,
            message: 'Credit package not found',
            error: 'Not Found'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async startPaymentEndpoint(
        @Param('packageId', ParseIntPipe) packageId: number,
        @UserId() userId: number,
    ): Promise<StartPaymentResponseDto> {
        return this.paymentService.startPayment(userId, packageId);
    }
}
