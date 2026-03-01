import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus, NotFoundException, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import {
  VerifyTransactionByHashDto,
  TransactionVerificationResponseDto,
  MarkTransactionPaidDto,
  MarkTransactionRejectedDto,
  TransactionListResponseDto,
  TransactionDetailDto,
  TransactionResponseDto,
} from '../../libs/dtos/admin/transaction-admin.dto';
import { Payment } from '../../libs/entities/ai/payment.entity';
import { PaymentStatus } from '../../libs/enums/Status';
import { PaymentFlowService } from '../wallet/payment-flow.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/security/guards/roles.guard';
import { SystemRole } from '../../libs/enums/Role';

@ApiTags('Admin - Transactions')
@Controller('admin/transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles(SystemRole.SuperAdmin)
export class AdminTransactionsController {
  private readonly logger = new Logger(AdminTransactionsController.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private readonly paymentFlowService: PaymentFlowService,
  ) { }

  // ==================== GET ALL TRANSACTIONS ====================
  @Get()
  @ApiOperation({
    summary: 'Get All Transactions (Paginated & Searchable)',
    description: 'Retrieve paginated list of transactions with optional filtering',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['paid', 'unpaid', 'all'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          data: [
            {
              id: 123,
              user: 'John Doe',
              userId: 456,
              amount: 49.99,
              currency: 'USD',
              method: 'credit_card',
              status: 'paid',
              date: '2026-03-01T09:00:00Z',
              userNote: null,
              proofImageUrl: null,
              verificationNote: null,
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      },
    },
  })
  async getAllTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status: string = 'all',
    @Query('search') search: string = '',
  ): Promise<{ success: true; data: TransactionListResponseDto }> {
    // Convert to numbers if they're strings
    const pageNum = page ? parseInt(String(page), 10) : 1;
    const limitNum = limit ? parseInt(String(limit), 10) : 10;
    const validPage = Math.max(1, pageNum);
    const validLimit = Math.min(100, Math.max(1, limitNum));

    const where: any = {};

    if (status !== 'all') {
      where.status = status === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING;
    }

    if (search) {
      where.transactionId = ILike(`%${search}%`);
    }

    const [payments, total] = await this.paymentRepo.findAndCount({
      where,
      relations: ['user'],
      skip: (validPage - 1) * validLimit,
      take: validLimit,
      order: { created_at: 'DESC' },
    });

    const transactionData: TransactionResponseDto[] = payments.map((payment) => ({
      id: payment.id,
      user: payment.user ? `${payment.user.firstName} ${payment.user.lastName || ''}`.trim() : 'Unknown',
      userId: payment.user?.id || null,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.paymentMethod,
      status: payment.status === PaymentStatus.COMPLETED ? 'paid' : 'unpaid',
      date: payment.created_at.toISOString(),
      userNote: null,
      proofImageUrl: null,
      verificationNote: null,
    }));

    const responseData: TransactionListResponseDto = {
      data: transactionData,
      total,
      page: validPage,
      limit: validLimit,
    };

    return { success: true, data: responseData };
  }

  // ==================== GET TRANSACTION DETAILS ====================
  @Get(':transactionId')
  @ApiOperation({
    summary: 'Get Transaction Details',
    description: 'Retrieve detailed information about a specific transaction',
  })
  @ApiParam({ name: 'transactionId', type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          id: 123,
          user: 'John Doe',
          userId: 456,
          amount: 49.99,
          currency: 'USD',
          method: 'credit_card',
          status: 'paid',
          date: '2026-03-01T09:00:00Z',
          transactionDetails: {},
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async getTransactionDetails(@Param('transactionId') transactionId: string): Promise<{ success: true; data: TransactionDetailDto }> {
    const payment = await this.paymentRepo.findOne({
      where: { id: parseInt(transactionId, 10) },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    const data: TransactionDetailDto = {
      id: payment.id,
      user: payment.user ? `${payment.user.firstName} ${payment.user.lastName || ''}`.trim() : 'Unknown',
      userId: payment.user.id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.paymentMethod,
      status: payment.status === PaymentStatus.COMPLETED ? 'paid' : 'unpaid',
      date: payment.created_at.toISOString(),
      transactionDetails: payment.transactionDetails || {},
    };

    return { success: true, data };
  }

  // ==================== VERIFY PAYMENT BY HASH ====================
  @Post('verify-by-hash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Payment by Hash (Backend Integration)',
    description: 'Check transaction status using Bakong transaction hash',
  })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          status: 'Success',
          senderAccountId: 'acc_001',
          recipientAccountId: 'acc_002',
          amount: 49.99,
          currency: 'USD',
          description: 'Payment for credits',
          transactionDate: '2026-03-01T09:00:00Z',
          trackingStatus: 'Completed',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid hash or amount mismatch',
    example: {
      status: 'Failed',
      message: 'Transaction not found or amount mismatch',
    },
  })
  async verifyPaymentByHash(
    @Body() dto: VerifyTransactionByHashDto,
  ): Promise<{ success: true; data: TransactionVerificationResponseDto }> {
    try {
      const response = await this.paymentFlowService.verifyTransactionByHash(
        dto.transactionHash,
        dto.amount,
        'USD',
        dto.userId,
      );

      if (response.responseCode !== 0 || !response.data) {
        throw new BadRequestException('Transaction not found or amount mismatch');
      }

      const data: TransactionVerificationResponseDto = {
        status: 'Success',
        senderAccountId: response.data.fromAccountId,
        recipientAccountId: response.data.toAccountId,
        amount: response.data.amount,
        currency: response.data.currency,
        description: response.data.description,
        transactionDate: new Date(response.data.createdDateMs).toISOString(),
        trackingStatus: response.data.trackingStatus || 'Completed',
      };

      return { success: true, data };
    } catch (error) {
      this.logger.error('Failed to verify payment by hash:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to verify payment with Bakong API');
    }
  }

  // ==================== MARK TRANSACTION AS PAID ====================
  @Post(':transactionId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark Transaction as Paid',
    description: 'Verify and mark a transaction as paid',
  })
  @ApiParam({ name: 'transactionId', type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          id: 123,
          status: 'paid',
          verifiedAt: '2026-03-01T09:00:00Z',
          verificationNote: 'Verified by admin',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async markTransactionAsPaid(
    @Param('transactionId') transactionId: string,
    @Body() dto: MarkTransactionPaidDto,
  ): Promise<{ success: true; data: any }> {
    const id = parseInt(transactionId.replace('TX-', ''), 10);

    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    payment.status = PaymentStatus.COMPLETED;
    await this.paymentRepo.save(payment);

    const data = {
      id: payment.id,
      status: 'paid',
      verifiedAt: new Date().toISOString(),
      verificationNote: dto.verificationNote,
    };

    return { success: true, data };
  }

  // ==================== MARK TRANSACTION AS UNPAID/REJECTED ====================
  @Post(':transactionId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark Transaction as Unpaid (Reject Payment)',
    description: 'Reject a payment and return it to unpaid status',
  })
  @ApiParam({ name: 'transactionId', type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          id: 123,
          status: 'unpaid',
          rejectionReason: 'Insufficient funds',
          rejectedAt: '2026-03-01T09:00:00Z',
          verificationNote: 'Rejected by admin',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async markTransactionAsRejected(
    @Param('transactionId') transactionId: string,
    @Body() dto: MarkTransactionRejectedDto,
  ): Promise<{ success: true; data: any }> {
    const id = parseInt(transactionId.replace('TX-', ''), 10);

    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    payment.status = PaymentStatus.FAILED;
    await this.paymentRepo.save(payment);

    const data = {
      id: payment.id,
      status: 'unpaid',
      rejectionReason: dto.reason,
      rejectedAt: new Date().toISOString(),
      verificationNote: dto.verificationNote,
    };

    return { success: true, data };
  }
}
