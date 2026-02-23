import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { 
    ApiBearerAuth, 
    ApiOperation, 
    ApiOkResponse, 
    ApiTags,
    ApiUnauthorizedResponse,
    ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { CreditPackageService } from './credit-package.service';
import {
    TransactionHistoryQueryDto,
    WalletBalanceResponseDto,
    TransactionHistoryResponseDto,
} from '../../libs/dtos/wallet/wallet.dto';
import { CreditPackageResponseDto } from '../../libs/dtos/wallet/credit-package-response.dto';

@ApiTags('Wallet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
    constructor(
        private walletService: WalletService,
        private creditPackageService: CreditPackageService,
    ) { }

    // ==================== GET BALANCE ====================
    @Get('balance')
    @ApiOperation({ 
        summary: 'Get current credit balance',
        description: 'Retrieves the current credit balance for the authenticated user. Creates a wallet if one doesn\'t exist.'
    })
    @ApiOkResponse({ 
        description: 'Credit balance retrieved successfully',
        type: WalletBalanceResponseDto,
        example: {
            userId: 1,
            creditBalance: 150.50
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
    async getBalance(@Request() req): Promise<WalletBalanceResponseDto> {
        const userId = req.user.id;
        const creditBalance = await this.walletService.getBalance(userId);
        return { userId, creditBalance };
    }

    // ==================== GET TRANSACTION HISTORY ====================
    @Get('transactions')
    @ApiOperation({ 
        summary: 'Get transaction history',
        description: 'Retrieves paginated transaction history for the authenticated user including credits added, deductions, purchases, and refunds.'
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
    @ApiOkResponse({ 
        description: 'Transaction history retrieved successfully',
        type: TransactionHistoryResponseDto,
        example: {
            data: [
                {
                    id: 1,
                    walletId: 1,
                    amount: 50.00,
                    type: 'credit',
                    reason: 'purchase',
                    balanceBefore: 100.00,
                    balanceAfter: 150.00,
                    description: 'Added 50 credits via purchase',
                    metadata: null,
                    created_at: '2024-01-15T10:30:00Z'
                }
            ],
            meta: {
                total: 25,
                page: 1,
                limit: 10,
                totalPages: 3
            }
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
    async getTransactionHistory(
        @Request() req,
        @Query() query: TransactionHistoryQueryDto,
    ): Promise<TransactionHistoryResponseDto> {
        const userId = req.user.id;
        return this.walletService.getTransactionHistory(
            userId,
            query.page,
            query.limit,
        );
    }

    // ==================== GET AVAILABLE PACKAGES ====================
    @Get('packages')
    @ApiOperation({ 
        summary: 'List credit packages available for purchase',
        description: 'Retrieves all active credit packages that users can purchase. Sorted by display order and price.'
    })
    @ApiOkResponse({ 
        description: 'Credit packages retrieved successfully',
        type: [CreditPackageResponseDto],
        example: [
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
                name: 'Premium Pack',
                description: 'Best value for power users',
                credits: 500,
                bonusCredits: 100,
                price: 39.99,
                currency: 'USD',
                discountInPercent: 10,
                isActive: true,
                sortOrder: 2,
                created_at: '2024-01-15T10:30:00Z',
                updated_at: '2024-01-15T10:30:00Z'
            }
        ]
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async getPackages(): Promise<CreditPackageResponseDto[]> {
        return this.creditPackageService.findAllActive();
    }
}