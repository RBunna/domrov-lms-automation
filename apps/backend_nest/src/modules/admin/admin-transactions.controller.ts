import { Controller, Get, Param, Query, NotFoundException, Logger, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import {
  TransactionListResponseDto,
  TransactionDetailDto,
  TransactionResponseDto,
} from '../../libs/dtos/admin/transaction-admin.dto';
import { Payment } from '../../libs/entities/ai/payment.entity';
import { PaymentStatus } from '../../libs/enums/Status';
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
}
