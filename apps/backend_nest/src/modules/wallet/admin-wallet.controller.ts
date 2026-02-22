import { Body, Controller, Get, Post, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreditPackageService } from './credit-package.service';
import { CreateCreditPackageDto, UpdateCreditPackageDto } from '../../libs/dtos/wallet/wallet.dto';
import { AdminAdjustWalletDTO } from '../../libs/dtos/wallet/admin-adjust-wallet.dto';

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

    @Post('packages')
    @ApiOperation({ summary: 'Create new token package' })
    async createPackage(@Body() dto: CreateCreditPackageDto) {
        return this.packageService.create(dto);
    }

    @Get('packages')
    @ApiOperation({ summary: 'View all packages (active & inactive)' })
    async getAllPackages() {
        return this.packageService.findAll();
    }

    @Patch('packages/:id/toggle')
    @ApiOperation({ summary: 'Activate/Deactivate package' })
    async togglePackage(@Param('id', ParseIntPipe) id: number) {
        return this.packageService.toggleActive(id);
    }

    @Post('adjust')
    @ApiOperation({ summary: 'Manually add/remove tokens from user (Refund/Bonus)' })
    async manualAdjustment(@Body() dto: AdminAdjustWalletDTO) {
        if (dto.amount >= 0) {
            return this.walletService.addCredits(
                dto.userId,
                dto.amount,
                dto.reason,
                dto.description,
            );
        } else {
            const result = await this.walletService.deductCredits(
                dto.userId,
                Math.abs(dto.amount),
                dto.reason,
                dto.description,
            );
            return { success: result };
        }
    }
}