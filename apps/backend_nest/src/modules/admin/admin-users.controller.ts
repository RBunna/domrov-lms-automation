import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus, NotFoundException, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import {
  AddCreditsDto,
  DeductCreditsDto,
  AddCreditsResponseDto,
  ToggleUserStatusDto,
  UserListResponseDto,
  UserDetailDto,
} from '../../libs/dtos/admin/user-admin.dto';
import { User } from '../../libs/entities/user/user.entity';
import { UserStatus } from '../../libs/enums/Status';
import { UserCreditBalance } from '../../libs/entities/ai/user-credit-balance.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionReason } from '../../libs/entities/ai/wallet-transaction.entity';
import { Payment } from '../../libs/entities/ai/payment.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/security/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../../libs/enums/Role';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles(SystemRole.SuperAdmin)
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserCreditBalance)
    private readonly walletRepo: Repository<UserCreditBalance>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly walletService: WalletService,
  ) { }

  // ==================== GET ALL USERS ====================
  @Get()
  @ApiOperation({
    summary: 'Get All Users (Paginated & Searchable)',
    description: 'Retrieve paginated list of users with optional filtering and search',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'suspended', 'all'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          data: [
            {
              id: 123,
              firstName: 'John',
              lastName: 'Doe',
              gender: 'M',
              dob: '1990-05-15',
              email: 'john@example.com',
              phoneNumber: '+1234567890',
              profilePictureUrl: 'https://example.com/profile.jpg',
              isVerified: true,
              status: 'active',
              role: 'user',
              credits: 1000,
              joinDate: '2026-03-01T09:00:00Z',
              lastActivity: '2026-03-01T10:00:00Z',
              totalPurchased: 5,
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      },
    },
  })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status: string = 'all',
    @Query('search') search: string = '',
  ): Promise<{ success: true; data: UserListResponseDto }> {
    // Convert to numbers if they're strings
    const pageNum = page ? parseInt(String(page), 10) : 1;
    const limitNum = limit ? parseInt(String(limit), 10) : 10;
    const validPage = Math.max(1, pageNum);
    const validLimit = Math.min(100, Math.max(1, limitNum));

    const where: any = {};
    if (status !== 'all') {
      where.status = status === 'active' ? UserStatus.ACTIVE : UserStatus.BANNED;
    }
    if (search) {
      where.email = ILike(`%${search}%`);
    }

    const [users, total] = await this.userRepo.findAndCount({
      where,
      select: ['id', 'firstName', 'lastName', 'gender', 'dob', 'email', 'phoneNumber', 'profilePictureUrl', 'isVerified', 'status', 'role', 'created_at', 'updated_at'],
      skip: (validPage - 1) * validLimit,
      take: validLimit,
      order: { created_at: 'DESC' },
    });

    // Get credit balances for each user
    const listData = await Promise.all(
      users.map(async (user) => {
        const wallet = await this.walletRepo.findOne({
          where: { user: { id: user.id } },
        });

        // Get total purchases
        const purchases = await this.paymentRepo.count({
          where: { user: { id: user.id } },
        });

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName || null,
          gender: user.gender || null,
          dob: user.dob ? user.dob.toISOString().split('T')[0] : null,
          email: user.email,
          phoneNumber: user.phoneNumber || null,
          profilePictureUrl: user.profilePictureUrl || null,
          isVerified: user.isVerified,
          status: user.status,
          role: user.role,
          credits: wallet?.creditBalance || 0,
          joinDate: user.created_at,
          lastActivity: user.updated_at,
          totalPurchased: purchases,
        };
      }),
    );

    const responseData: UserListResponseDto = {
      data: listData,
      total,
      page: validPage,
      limit: validLimit,
    };

    return { success: true, data: responseData };
  }

  // ==================== GET USER DETAILS ====================
  @Get(':userId')
  @ApiOperation({
    summary: 'Get User Details',
    description: 'Retrieve detailed information about a specific user',
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          id: '123',
          firstName: 'John',
          lastName: 'Doe',
          gender: 'M',
          dob: '1990-05-15',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://example.com/profile.jpg',
          isVerified: true,
          status: 'active',
          role: 'user',
          credits: 1000,
          joinDate: '2026-03-01T09:00:00Z',
          lastActivity: '2026-03-01T10:00:00Z',
          totalSpent: 500,
          recentTransactions: [
            {
              id: 'TXN-1',
              amount: 100,
              date: '2026-03-01T09:00:00Z',
              status: 'paid',
            },
          ],
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserDetails(@Param('userId', ParseIntPipe) userId: number): Promise<{ success: true; data: UserDetailDto }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'firstName', 'lastName', 'gender', 'dob', 'email', 'phoneNumber', 'profilePictureUrl', 'isVerified', 'status', 'role', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
    });

    // Get recent transactions
    const payments = await this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId })
      .orderBy('payment.created_at', 'DESC')
      .limit(5)
      .getMany();

    const recentTransactions = payments.map((p) => ({
      id: `TXN-${p.id}`,
      amount: p.amount,
      date: p.created_at,
      status: p.status,
    }));

    const detailData: UserDetailDto = {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName || null,
      gender: user.gender || null,
      dob: user.dob ? user.dob.toISOString().split('T')[0] : null,
      email: user.email,
      phoneNumber: user.phoneNumber || null,
      profilePictureUrl: user.profilePictureUrl || null,
      isVerified: user.isVerified,
      status: user.status,
      role: user.role,
      credits: wallet?.creditBalance || 0,
      joinDate: user.created_at.toISOString(),
      lastActivity: user.updated_at.toISOString(),
      totalSpent: payments.reduce((sum, p) => sum + p.amount, 0),
      recentTransactions,
    };

    return { success: true, data: detailData };
  }

  // ==================== ADD CREDITS ====================
  @Post(':userId/credits/add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add Credits to User',
    description: 'Add credits to a user wallet for bonuses, promotions, etc.',
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          userId: '123',
          previousBalance: 500,
          newBalance: 1000,
          transactionId: 'txn_1234567890',
          timestamp: '2026-03-01T09:00:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async addCredits(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AddCreditsDto,
  ): Promise<{ success: true; data: AddCreditsResponseDto }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.walletService.addCredits(
      userId,
      dto.amount,
      dto.reason as any as TransactionReason,
      dto.adminNote || `Admin added ${dto.amount} credits - ${dto.reason}`,
    );

    const walletBefore = wallet.creditBalance - dto.amount;

    const creditsData: AddCreditsResponseDto = {
      userId: user.id.toString(),
      previousBalance: walletBefore,
      newBalance: wallet.creditBalance,
      transactionId: `txn_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    return { success: true, data: creditsData };
  }

  // ==================== DEDUCT CREDITS ====================
  @Post(':userId/credits/deduct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deduct Credits from User',
    description: 'Deduct credits from a user wallet for refunds or adjustments',
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          userId: '123',
          previousBalance: 1000,
          newBalance: 500,
          transactionId: 'txn_1234567890',
          timestamp: '2026-03-01T09:00:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid request or insufficient balance' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async deductCredits(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: DeductCreditsDto,
  ): Promise<{ success: true; data: AddCreditsResponseDto }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet || wallet.creditBalance < dto.amount) {
      throw new BadRequestException('Insufficient credit balance');
    }

    const updatedWallet = await this.walletService.deductCredits(
      userId,
      dto.amount,
      dto.reason as any as TransactionReason,
      dto.adminNote || `Admin deducted ${dto.amount} credits - ${dto.reason}`,
    );

    const walletBefore = wallet.creditBalance;

    const creditsData: AddCreditsResponseDto = {
      userId: user.id.toString(),
      previousBalance: walletBefore,
      newBalance: updatedWallet.creditBalance,
      transactionId: `txn_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    return { success: true, data: creditsData };
  }

  // ==================== TOGGLE USER STATUS ====================
  @Patch(':userId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle User Status',
    description: 'Activate or suspend a user account',
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          id: 123,
          status: 'active',
          reason: 'Manual activation',
          updatedAt: '2026-03-01T09:00:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async toggleUserStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ToggleUserStatusDto,
  ): Promise<{ success: true; data: any }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const newStatus = dto.status === 'active' ? UserStatus.ACTIVE : UserStatus.BANNED;
    user.status = newStatus;
    await this.userRepo.save(user);

    const statusData = {
      id: user.id,
      status: newStatus,
      reason: dto.reason || null,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: statusData };
  }

  // ==================== DELETE USER ====================
  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete User',
    description: 'Delete a user account permanently',
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          message: 'User deleted successfully',
          deletedUserId: 123,
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async deleteUser(@Param('userId', ParseIntPipe) userId: number): Promise<{ success: true; data: any }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Delete wallet first
    await this.walletRepo.delete({ user: { id: userId } });

    // Delete user
    await this.userRepo.delete({ id: userId });

    const deleteData = {
      message: 'User deleted successfully',
      deletedUserId: userId,
    };

    return { success: true, data: deleteData };
  }
}
