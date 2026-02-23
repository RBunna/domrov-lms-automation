import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../../libs/entities/user/user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateUserDTO } from '../../libs/dtos/update.user.dto';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UserProfileResponseDto,
  UpdateProfileResponseDto,
  ChangePasswordResponseDto,
  UserListItemDto,
} from '../../libs/dtos/user/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  /**
   * Get current user's profile
   */
  async getMyProfile(userId: number): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id', 'firstName', 'lastName', 'email', 'gender', 'dob',
        'phoneNumber', 'profilePictureUrl', 'isVerified', 'isTwoFactorEnable',
        'status', 'created_at', 'updated_at'
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update current user's profile (no password change here)
   */
  async updateMyProfile(userId: number, dto: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check phone number uniqueness if provided
    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const existingPhone = await this.userRepository.findOne({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    // Update only provided fields
    Object.assign(user, dto);
    await this.userRepository.save(user);

    // Return updated profile
    const updatedUser = await this.getMyProfile(userId);
    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  /**
   * Change password - requires current password verification
   */
  async changePassword(userId: number, dto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
    // Validate new password confirmation
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash and update password
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<UserListItemDto[]> {
    const users = await this.userRepository.find({
      select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'profilePictureUrl', 'status', 'isVerified'],
      order: { id: 'ASC' },
    });

    return users;
  }

  // ==================== LEGACY METHODS ====================

  async update(id: string, updateUserDto: UpdateUserDTO) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const result = await this.userRepository.update(id, updateUserDto);

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User updated successfully',
      affectedRows: result.affected,
    };
  }

  async findByQuery(query: Record<string, any>): Promise<User[] | User> {
    const { id, email, firstName, lastName, phoneNumber } = query;

    const where: any = {};
    if (id) where.id = id;
    if (email) where.email = ILike(`%${email}%`);
    if (firstName) where.firstName = ILike(`%${firstName}%`);
    if (lastName) where.lastName = ILike(`%${lastName}%`);
    if (phoneNumber) where.phoneNumber = ILike(`%${phoneNumber}%`);

    const users = await this.userRepository.find({
      where,
      select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'profilePictureUrl'],
    });

    return users;
  }
}
