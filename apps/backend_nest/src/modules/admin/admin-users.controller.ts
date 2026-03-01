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
import { Repository, ILike, Between, In } from 'typeorm';
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
    summary: 'Get All Users (Paginated & Searchable with Advanced Filters)',
    description: 'Retrieve paginated list of users with optional filtering and multi-field search',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'all'], description: 'Filter by user status' })
  @ApiQuery({ name: 'role', required: false, enum: ['user', 'admin', 'superadmin', 'all'], description: 'Filter by user role' })
  @ApiQuery({ name: 'verified', required: false, enum: ['true', 'false', 'all'], description: 'Filter by email verification status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by firstName, lastName, email, or phoneNumber' })
  @ApiQuery({ name: 'joinDateFrom', required: false, type: String, description: 'Filter by join date (from) - ISO format' })
  @ApiQuery({ name: 'joinDateTo', required: false, type: String, description: 'Filter by join date (to) - ISO format' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['newest', 'oldest', 'firstNameAsc', 'firstNameDesc', 'emailAsc'], description: 'Sort order', example: 'newest' })
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
          total: 100,
          page: 1,
          limit: 10,
          filtered: true,
        },
      },
    },
  })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status: string = 'all',
    @Query('role') role: string = 'all',
    @Query('verified') verified: string = 'all',
    @Query('search') search: string = '',
    @Query('joinDateFrom') joinDateFrom: string = '',
    @Query('joinDateTo') joinDateTo: string = '',
    @Query('sortBy') sortBy: string = 'newest',
  ): Promise<{ success: true; data: UserListResponseDto }> {
    try {
      // Validate and parse pagination parameters
      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));

      // Build where clause with multiple conditions
      const where: any = {};

      // ✅ STATUS FILTER - Fix for proper enum mapping
      if (status !== 'all') {
        const statusMap: Record<string, UserStatus> = {
          'active': UserStatus.ACTIVE,
          'inactive': UserStatus.INACTIVE,
        };
        if (statusMap[status]) {
          where.status = statusMap[status];
        }
      }

      // ✅ ROLE FILTER
      if (role !== 'all') {
        const roleMap: Record<string, SystemRole> = {
          'user': SystemRole.User,
          'admin': SystemRole.Admin,
          'superadmin': SystemRole.SuperAdmin,
        };
        if (roleMap[role]) {
          where.role = roleMap[role];
        }
      }

      // ✅ VERIFICATION STATUS FILTER
      if (verified !== 'all') {
        where.isVerified = verified === 'true';
      }

      // ✅ MULTI-FIELD SEARCH - Improved to search firstName, lastName, email, phoneNumber
      if (search && search.trim()) {
        const searchTerm = search.trim();
        where.email = ILike(`%${searchTerm}%`);
        // TypeORM doesn't support OR in where clause directly, so we'll use query builder
      }

      // ✅ DATE RANGE FILTER
      if (joinDateFrom || joinDateTo) {
        const dateWhere: any = {};
        
        if (joinDateFrom) {
          const fromDate = new Date(joinDateFrom);
          if (!isNaN(fromDate.getTime())) {
            dateWhere.from = fromDate;
          }
        }

        if (joinDateTo) {
          const toDate = new Date(joinDateTo);
          if (!isNaN(toDate.getTime())) {
            dateWhere.to = toDate;
          }
        }

        if (dateWhere.from || dateWhere.to) {
          where.created_at = Between(
            dateWhere.from || new Date('1970-01-01'),
            dateWhere.to || new Date(),
          );
        }
      }

      // Sort mapping
      const sortMap: Record<string, [string, 'ASC' | 'DESC']> = {
        'newest': ['created_at', 'DESC'],
        'oldest': ['created_at', 'ASC'],
        'firstNameAsc': ['firstName', 'ASC'],
        'firstNameDesc': ['firstName', 'DESC'],
        'emailAsc': ['email', 'ASC'],
      };

      const [sortField, sortOrder] = sortMap[sortBy] || sortMap['newest'];

      // ✅ Use QueryBuilder for multi-field search (OR conditions)
      let query = this.userRepo.createQueryBuilder('user');

      // Apply multi-field search
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.where(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phoneNumber ILIKE :search)',
          { search: searchTerm },
        );
      }

      // Apply other filters
      if (status !== 'all') {
        const statusMap: Record<string, UserStatus> = {
          'active': UserStatus.ACTIVE,
          'inactive': UserStatus.INACTIVE,
        };
        if (statusMap[status]) {
          query = query.andWhere('user.status = :status', { status: statusMap[status] });
        } else {
          // Invalid status value, log warning
          this.logger.warn(`Invalid status filter value: ${status}`);
        }
      }

      if (role !== 'all') {
        const roleMap: Record<string, SystemRole> = {
          'user': SystemRole.User,
          'admin': SystemRole.Admin,
          'superadmin': SystemRole.SuperAdmin,
        };
        if (roleMap[role]) {
          query = query.andWhere('user.role = :role', { role: roleMap[role] });
        }
      }

      if (verified !== 'all') {
        const isVerified = verified === 'true';
        query = query.andWhere('user.isVerified = :isVerified', { isVerified });
      }

      // Date range filter
      if (joinDateFrom || joinDateTo) {
        if (joinDateFrom) {
          const fromDate = new Date(joinDateFrom);
          if (!isNaN(fromDate.getTime())) {
            query = query.andWhere('user.created_at >= :fromDate', { fromDate });
          }
        }
        if (joinDateTo) {
          const toDate = new Date(joinDateTo);
          if (!isNaN(toDate.getTime())) {
            query = query.andWhere('user.created_at <= :toDate', { toDate });
          }
        }
      }

      // Apply pagination and sorting
      const [users, total] = await query
        .orderBy(`user.${sortField}`, sortOrder)
        .skip((pageNum - 1) * limitNum)
        .take(limitNum)
        .getManyAndCount();

      // Get credit balances and purchase counts for each user
      const listData = await Promise.all(
        users.map(async (user) => {
          const wallet = await this.walletRepo.findOne({
            where: { user: { id: user.id } },
          });

          const purchases = await this.paymentRepo.count({
            where: { user: { id: user.id } },
          });

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName || null,
            gender: user.gender || null,
            dob: user.dob ? (user.dob instanceof Date ? user.dob.toISOString().split('T')[0] : String(user.dob).split('T')[0]) : null,
            email: user.email,
            phoneNumber: user.phoneNumber || null,
            profilePictureUrl: user.profilePictureUrl || null,
            isVerified: user.isVerified,
            status: user.status,
            role: user.role,
            credits: wallet?.creditBalance || 0,
            joinDate: user.created_at.toISOString(),
            lastActivity: user.updated_at.toISOString(),
            totalPurchased: purchases,
          };
        }),
      );

      const responseData: UserListResponseDto = {
        data: listData,
        total,
        page: pageNum,
        limit: limitNum,
        filtered: (status !== 'all' || role !== 'all' || verified !== 'all' || !!search || !!joinDateFrom || !!joinDateTo),
      };

      return { success: true, data: responseData };
    } catch (err) {
      this.logger.error('Failed to fetch users:', err);
      throw new BadRequestException('Failed to fetch users. Please check your filter parameters.');
    }
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
      id: p.id,
      amount: p.amount,
      date: p.created_at,
      status: p.status,
    }));

    const detailData: UserDetailDto = {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName || null,
      gender: user.gender || null,
      dob: user.dob ? (user.dob instanceof Date ? user.dob.toISOString().split('T')[0] : String(user.dob).split('T')[0]) : null,
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
    description: 'Activate or deactivate a user account',
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

    const statusMap: Record<string, UserStatus> = {
      'active': UserStatus.ACTIVE,
      'inactive': UserStatus.INACTIVE,
    };

    const newStatus = statusMap[dto.status];
    if (!newStatus) {
      throw new BadRequestException('Invalid status value. Allowed values: active, inactive');
    }

    user.status = newStatus;
    await this.userRepo.save(user);

    this.logger.log(`User ${userId} status changed to ${newStatus} - Reason: ${dto.reason || 'No reason provided'}`);

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
