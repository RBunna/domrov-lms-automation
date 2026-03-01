import { Body, Controller, Get, Post, Patch, Param, ParseIntPipe, HttpCode, HttpStatus, BadRequestException, UseGuards, Query, NotFoundException } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
    ApiParam,
    ApiBody,
    ApiQuery,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { WalletService } from './wallet.service';
import { CreditPackageService } from './credit-package.service';
import { CreateCreditPackageDto, UpdateCreditPackageDto } from '../../libs/dtos/wallet/wallet.dto';
import { AdminAdjustWalletDTO } from '../../libs/dtos/wallet/admin-adjust-wallet.dto';
import { CreditPackageResponseDto } from '../../libs/dtos/wallet/credit-package-response.dto';
import { AdminAdjustWalletResponseDto, AdminDeductResponseDto } from '../../libs/dtos/wallet/admin-adjust-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/security/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemRole } from '../../libs/enums/Role';
import { Payment } from '../../libs/entities/ai/payment.entity';
import { PaymentStatus } from '../../libs/enums/Status';

@ApiTags('Wallet (Admin)')
@Controller('admin/wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.SuperAdmin)
export class AdminWalletController {
    constructor(
        private readonly packageService: CreditPackageService,
        private readonly walletService: WalletService,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) { }

    // ==================== CREATE PACKAGE ====================
    @Post('packages')
    @ApiOperation({
        summary: 'Create new credit package',
        description: 'Creates a new credit package that users can purchase. Admin only.'
    })
    @ApiBody({
        type: CreateCreditPackageDto,
        description: 'Credit package details',
        examples: {
            example1: {
                summary: 'Standard package',
                value: {
                    name: 'Premium Pack',
                    description: 'Best value for power users',
                    credits: 500,
                    price: 39.99,
                    currency: 'USD',
                    bonusCredits: 50,
                    sortOrder: 2,
                    isActive: true
                }
            }
        }
    })
    @ApiCreatedResponse({
        schema: {
            example: {
                success: true,
                data: {
                    id: 1,
                    name: 'Premium Pack',
                    description: 'Best value for power users',
                    credits: 500,
                    bonusCredits: 50,
                    price: 39.99,
                    currency: 'USD',
                    discountInPercent: 0,
                    isActive: true,
                    sortOrder: 2,
                    created_at: '2024-01-15T10:30:00Z',
                    updated_at: '2024-01-15T10:30:00Z'
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Invalid input data',
        example: {
            statusCode: 400,
            message: 'Validation failed',
            error: 'Bad Request'
        }
    })
    @ApiUnauthorizedResponse({
        description: 'Admin not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async createPackage(@Body() dto: CreateCreditPackageDto): Promise<{ success: true; data: CreditPackageResponseDto }> {
        const data = await this.packageService.create(dto);
        return { success: true, data };
    }

    // ==================== GET ALL PACKAGES ====================
    @Get('packages')
    @ApiOperation({
        summary: 'View all packages (active & inactive)',
        description: 'Retrieves all credit packages including inactive ones. Admin only.'
    })
    @ApiOkResponse({
        schema: {
            example: {
                success: true,
                data: [
                    {
                        id: 1,
                        name: 'Starter Pack',
                        description: 'Perfect for beginners',
                        credits: 100,
                        bonusCredits: 10,
                        price: 9.99,
                        currency: 'USD',
                        discountInPercent: 0,
                        isActive: true,
                        sortOrder: 1,
                        created_at: '2024-01-15T10:30:00Z',
                        updated_at: '2024-01-15T10:30:00Z'
                    },
                    {
                        id: 2,
                        name: 'Inactive Pack',
                        description: 'Discontinued package',
                        credits: 200,
                        bonusCredits: 0,
                        price: 19.99,
                        currency: 'USD',
                        discountInPercent: 0,
                        isActive: false,
                        sortOrder: 99,
                        created_at: '2024-01-10T10:30:00Z',
                        updated_at: '2024-01-12T10:30:00Z'
                    }
                ]
            }
        }
    })
    @ApiUnauthorizedResponse({
        description: 'Admin not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async getAllPackages(): Promise<{ success: true; data: CreditPackageResponseDto[] }> {
        const data = await this.packageService.findAll();
        return { success: true, data };
    }

    // ==================== TOGGLE PACKAGE STATUS ====================
    @Patch('packages/:id/toggle')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Activate/Deactivate package',
        description: 'Toggles the active status of a credit package. Inactive packages are hidden from users.'
    })
    @ApiParam({ name: 'id', type: Number, description: 'Credit package ID', example: 1 })
    @ApiOkResponse({
        schema: {
            example: {
                success: true,
                data: {
                    id: 1,
                    name: 'Premium Pack',
                    description: 'Best value for power users',
                    credits: 500,
                    bonusCredits: 50,
                    price: 39.99,
                    currency: 'USD',
                    discountInPercent: 0,
                    isActive: false,
                    sortOrder: 2,
                    created_at: '2024-01-15T10:30:00Z',
                    updated_at: '2024-01-16T10:30:00Z'
                }
            }
        }
    })
    @ApiNotFoundResponse({
        description: 'Credit package not found',
        example: {
            statusCode: 404,
            message: 'Credit package with ID 999 not found',
            error: 'Not Found'
        }
    })
    @ApiUnauthorizedResponse({
        description: 'Admin not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async togglePackage(@Param('id', ParseIntPipe) id: number): Promise<{ success: true; data: CreditPackageResponseDto }> {
        const data = await this.packageService.toggleActive(id);
        return { success: true, data };
    }

    // ==================== MANUAL WALLET ADJUSTMENT ====================
    @Post('adjust')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Manually add/remove credits from user wallet',
        description: 'Allows admin to manually adjust user wallet balance for refunds, bonuses, or corrections. Use positive amount to add credits, negative to deduct.'
    })
    @ApiBody({
        type: AdminAdjustWalletDTO,
        description: 'Wallet adjustment details',
        examples: {
            addCredits: {
                summary: 'Add bonus credits',
                value: {
                    userId: 1,
                    amount: 50,
                    type: 'CREDIT',
                    reason: 'BONUS',
                    description: 'Bonus credits for early adopter'
                }
            },
            deductCredits: {
                summary: 'Deduct credits (refund reversal)',
                value: {
                    userId: 1,
                    amount: -25,
                    type: 'DEBIT',
                    reason: 'ADMIN_ADJUSTMENT',
                    description: 'Refund reversal due to chargeback'
                }
            }
        }
    })
    @ApiOkResponse({
        schema: {
            example: {
                success: true,
                data: {
                    id: 1,
                    creditBalance: 150.50,
                    updated_at: '2024-01-15T10:30:00Z'
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Insufficient balance for deduction',
        example: {
            statusCode: 400,
            message: 'Insufficient credit balance',
            error: 'Bad Request'
        }
    })
    @ApiUnauthorizedResponse({
        description: 'Admin not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async manualAdjustment(@Body() dto: AdminAdjustWalletDTO): Promise<{ success: true; data: AdminAdjustWalletResponseDto | AdminDeductResponseDto }> {
        let data: AdminAdjustWalletResponseDto | AdminDeductResponseDto;

        if (dto.amount >= 0) {
            const wallet = await this.walletService.addCredits(
                dto.userId,
                dto.amount,
                dto.reason,
                dto.description,
            );
            data = {
                id: wallet.id,
                creditBalance: wallet.creditBalance,
                updated_at: wallet.updated_at
            };
        } else {
            const wallet = await this.walletService.deductCredits(
                dto.userId,
                Math.abs(dto.amount),
                dto.reason,
                dto.description,
            );
            data = { success: true };
        }

        return { success: true, data };
    }

    // ==================== GET ALL TRANSACTIONS (READ-ONLY) ====================
    @Get('transactions')
    @ApiOperation({
        summary: 'Get All Transactions (Paginated & Searchable)',
        description: 'Retrieve paginated list of payment transactions with optional filtering. Admin view only.',
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
                            method: 'bakong',
                            status: 'paid',
                            date: '2026-03-01T09:00:00Z',
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
    ): Promise<{ success: true; data: any }> {
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

        const transactionData = payments.map((payment) => ({
            id: payment.id,
            user: payment.user ? `${payment.user.firstName} ${payment.user.lastName || ''}`.trim() : 'Unknown',
            userId: payment.user?.id || null,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.paymentMethod,
            status: payment.status === PaymentStatus.COMPLETED ? 'paid' : 'unpaid',
            date: payment.created_at.toISOString(),
        }));

        const responseData = {
            data: transactionData,
            total,
            page: validPage,
            limit: validLimit,
        };

        return { success: true, data: responseData };
    }

    // ==================== GET TRANSACTION DETAILS (READ-ONLY) ====================
    @Get('transactions/:transactionId')
    @ApiOperation({
        summary: 'Get Transaction Details',
        description: 'Retrieve detailed information about a specific transaction. Admin view only.',
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
                    method: 'bakong',
                    status: 'paid',
                    date: '2026-03-01T09:00:00Z',
                    transactionDetails: {
                        hash: '208212f0',
                        fromAccountId: 'sender@bakong',
                        toAccountId: 'receiver@bakong',
                        amount: 49.99,
                        currency: 'USD',
                        description: 'Credit package purchase',
                        proofImageUrl: 'https://res.cloudinary.com/xxx/image/upload/receipt.jpg',
                    },
                },
            },
        },
    })
    @ApiNotFoundResponse({ description: 'Transaction not found' })
    async getTransactionDetails(
        @Param('transactionId') transactionId: string,
    ): Promise<{ success: true; data: any }> {
        const payment = await this.paymentRepo.findOne({
            where: { id: parseInt(transactionId, 10) },
            relations: ['user'],
        });

        if (!payment) {
            throw new NotFoundException(`Transaction ${transactionId} not found`);
        }

        const data = {
            id: payment.id,
            user: payment.user ? `${payment.user.firstName} ${payment.user.lastName || ''}`.trim() : 'Unknown',
            userId: payment.user?.id || null,
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