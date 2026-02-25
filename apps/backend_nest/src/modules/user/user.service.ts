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
    try {
      if (!userId) throw new BadRequestException('User ID is required');
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
    } catch (err) {
      throw err instanceof BadRequestException || err instanceof NotFoundException ? err : new BadRequestException('Failed to get user profile');
    }
  }

  /**
   * Update current user's profile (no password change here)
   */
  async updateMyProfile(userId: number, dto: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    try {
      if (!userId) throw new BadRequestException('User ID is required');
      if (!dto || typeof dto !== 'object') throw new BadRequestException('Invalid update data');
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
        const existingPhone = await this.userRepository.findOne({
          where: { phoneNumber: dto.phoneNumber },
        });
        if (existingPhone) {
          throw new BadRequestException('Phone number already in use');
        }
      }
      Object.assign(user, dto);
      await this.userRepository.save(user);
      const updatedUser = await this.getMyProfile(userId);
      return {
        message: 'Profile updated successfully',
        user: updatedUser,
      };
    } catch (err) {
      throw err instanceof BadRequestException || err instanceof NotFoundException ? err : new BadRequestException('Failed to update profile');
    }
  }

  /**
   * Change password - requires current password verification
   */
  async changePassword(userId: number, dto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
    try {
      if (!userId) throw new BadRequestException('User ID is required');
      if (!dto || typeof dto !== 'object') throw new BadRequestException('Invalid password change data');
      if (dto.newPassword !== dto.confirmPassword) {
        throw new BadRequestException('New password and confirmation do not match');
      }
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new ForbiddenException('Current password is incorrect');
      }
      const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
      if (isSamePassword) {
        throw new BadRequestException('New password must be different from current password');
      }
      user.password = await bcrypt.hash(dto.newPassword, 10);
      await this.userRepository.save(user);
      return { message: 'Password changed successfully' };
    } catch (err) {
      throw err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ForbiddenException ? err : new BadRequestException('Failed to change password');
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<UserListItemDto[]> {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'profilePictureUrl', 'status', 'isVerified'],
        order: { id: 'ASC' },
      });
      return users;
    } catch (err) {
      throw new BadRequestException('Failed to get users');
    }
  }

  // ==================== LEGACY METHODS ====================

  async update(id: string, updateUserDto: UpdateUserDTO) {
    try {
      if (!id) throw new BadRequestException('User ID is required');
      if (!updateUserDto || typeof updateUserDto !== 'object') throw new BadRequestException('Invalid update data');
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
    } catch (err) {
      throw err instanceof BadRequestException || err instanceof NotFoundException ? err : new BadRequestException('Failed to update user');
    }
  }

  async findByQuery(query: Record<string, any>): Promise<User[] | User> {
    try {
      if (!query || typeof query !== 'object') throw new BadRequestException('Invalid query');
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
    } catch (err) {
      throw new BadRequestException('Failed to search users');
    }
  }
}
