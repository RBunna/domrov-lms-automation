import { Body, Controller, Get, Post, Patch, Param, ParseIntPipe, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
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
    ApiBody
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreditPackageService } from './credit-package.service';
import { CreateCreditPackageDto, UpdateCreditPackageDto } from '../../libs/dtos/wallet/wallet.dto';
import { AdminAdjustWalletDTO } from '../../libs/dtos/wallet/admin-adjust-wallet.dto';
import { CreditPackageResponseDto } from '../../libs/dtos/wallet/credit-package-response.dto';
import { AdminAdjustWalletResponseDto, AdminDeductResponseDto } from '../../libs/dtos/wallet/admin-adjust-response.dto';

@ApiTags('Wallet (Admin)')
@Controller('admin/wallet')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN')
export class AdminWalletController {
    constructor(
        private readonly packageService: CreditPackageService,
        private readonly walletService: WalletService,
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
        description: 'Credit package created successfully',
        type: CreditPackageResponseDto,
        example: {
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
    async createPackage(@Body() dto: CreateCreditPackageDto): Promise<CreditPackageResponseDto> {
        return this.packageService.create(dto);
    }

    // ==================== GET ALL PACKAGES ====================
    @Get('packages')
    @ApiOperation({ 
        summary: 'View all packages (active & inactive)',
        description: 'Retrieves all credit packages including inactive ones. Admin only.'
    })
    @ApiOkResponse({ 
        description: 'All credit packages retrieved successfully',
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
    })
    @ApiUnauthorizedResponse({ 
        description: 'Admin not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async getAllPackages(): Promise<CreditPackageResponseDto[]> {
        return this.packageService.findAll();
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
        description: 'Package status toggled successfully',
        type: CreditPackageResponseDto,
        example: {
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
    async togglePackage(@Param('id', ParseIntPipe) id: number): Promise<CreditPackageResponseDto> {
        return this.packageService.toggleActive(id);
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
        description: 'Wallet adjusted successfully',
        schema: {
            oneOf: [
                { $ref: '#/components/schemas/AdminAdjustWalletResponseDto' },
                { $ref: '#/components/schemas/AdminDeductResponseDto' }
            ]
        },
        examples: {
            addResult: {
                summary: 'Credits added',
                value: {
                    id: 1,
                    creditBalance: 150.50,
                    updated_at: '2024-01-15T10:30:00Z'
                }
            },
            deductResult: {
                summary: 'Credits deducted',
                value: {
                    success: true
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
    async manualAdjustment(@Body() dto: AdminAdjustWalletDTO): Promise<AdminAdjustWalletResponseDto | AdminDeductResponseDto> {
        if (dto.amount >= 0) {
            const wallet = await this.walletService.addCredits(
                dto.userId,
                dto.amount,
                dto.reason,
                dto.description,
            );
            return {
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
            return { success: true };
        }
    }
}