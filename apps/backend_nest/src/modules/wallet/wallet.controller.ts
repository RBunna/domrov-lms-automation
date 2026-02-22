import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { CreditPackageService } from './credit-package.service';
import {
  TransactionHistoryQueryDto,
  WalletBalanceResponseDto,
} from '../../libs/dtos/wallet/wallet.dto';

@ApiTags('Wallet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private creditPackageService: CreditPackageService,
  ) { }

  @Get('balance')
  @ApiOperation({ summary: 'Get current credit balance' })
  @ApiResponse({ status: 200, type: WalletBalanceResponseDto })
  async getBalance(@Request() req) {
    const userId = req.user.id;
    const creditBalance = await this.walletService.getBalance(userId);
    return { userId, creditBalance };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactionHistory(
    @Request() req,
    @Query() query: TransactionHistoryQueryDto,
  ) {
    const userId = req.user.id;
    return this.walletService.getTransactionHistory(
      userId,
      query.page,
      query.limit,
    );
  }

  @Get('packages')
  @ApiOperation({ summary: 'List credit packages available for purchase' })
  async getPackages() {
    return this.creditPackageService.findAllActive();
  }
}