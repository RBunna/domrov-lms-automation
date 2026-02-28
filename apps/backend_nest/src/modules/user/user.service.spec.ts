import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Repository, ILike, UpdateResult } from 'typeorm';
import { User } from '../../libs/entities/user/user.entity';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Encryption } from '../../libs/utils/Encryption';

import {
    UpdateProfileDto,
    ChangePasswordDto,
    UserProfileResponseDto,
    UserListItemDto,
} from '../../libs/dtos/user/user.dto';
import { UpdateUserDTO } from '../../libs/dtos/update.user.dto';
import { UserService } from './user.service';
import { UserStatus } from '../../libs/enums/Status';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OAuthAccount } from '../../libs/entities/user/oauth-account.entity';
import { OAuthProvider } from '../../libs/entities/user/oauth-provider.entity';



describe('UserService', () => {
    let service: UserService;
    let userRepo: jest.Mocked<Repository<User>>;
    let oauthAccountRepo: jest.Mocked<Repository<OAuthAccount>>;
    let oauthProviderRepo: jest.Mocked<Repository<OAuthProvider>>;

    const mockUser: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        gender: 'male',
        dob: new Date('1990-01-01'),
        phoneNumber: '1234567890',
        profilePictureUrl: 'https://example.com/pic.jpg',
        isVerified: true,
        isTwoFactorEnable: false,
        status: UserStatus.ACTIVE,
        password: '$2b$10$hashedpassword',
        created_at: new Date(),
        updated_at: new Date(),
        aiKeys: [],
        classes: [],
        enrollments: [],
        leadTeams: [],
        teamMemberships: [],
        oauthAccounts: [],
        telegramChats: [],
        usageLogs: [],
        creditBalance: undefined,
        payments: [],
        submissions: [],
        refreshTokens: [],
        emailOtps: undefined,
    };

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: getRepositoryToken(User), useValue: { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), update: jest.fn(), create: jest.fn() } },
                { provide: getRepositoryToken(OAuthAccount), useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() } },
                { provide: getRepositoryToken(OAuthProvider), useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() } },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepo = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
        oauthAccountRepo = module.get(getRepositoryToken(OAuthAccount)) as jest.Mocked<Repository<OAuthAccount>>;
        oauthProviderRepo = module.get(getRepositoryToken(OAuthProvider)) as jest.Mocked<Repository<OAuthProvider>>;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- getMyProfile ---
    describe('getMyProfile', () => {
        it('returns user profile', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);
            const profile = await service.getMyProfile(1);
            expect(profile.id).toBe(1);
            expect(userRepo.findOne).toHaveBeenCalled();
        });

        it('throws BadRequest for missing ID', async () => {
            await expect(service.getMyProfile(0)).rejects.toThrow(BadRequestException);
        });

        it('throws NotFound if user not exists', async () => {
            userRepo.findOne.mockResolvedValue(null);
            await expect(service.getMyProfile(1)).rejects.toThrow(NotFoundException);
        });
    });

    // --- updateMyProfile ---
    describe('updateMyProfile', () => {
        const dto: UpdateProfileDto = { firstName: 'Jane', phoneNumber: '0987654321' };

        it('throws BadRequest for invalid DTO', async () => {
            await expect(service.updateMyProfile(1, null as any)).rejects.toThrow(BadRequestException);
        });

        it('throws if phone number already in use', async () => {
            userRepo.findOne
                .mockResolvedValueOnce(mockUser) // fetch user
                .mockResolvedValueOnce({ ...mockUser, id: 2 }); // phone conflict
            await expect(service.updateMyProfile(1, dto)).rejects.toThrow(BadRequestException);
        });
    });

    // --- changePassword ---
    describe('changePassword', () => {
        const dto: ChangePasswordDto = { currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' };

        it('changes password successfully', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);
            jest.spyOn(Encryption, 'verifyPassword').mockResolvedValueOnce(true).mockResolvedValueOnce(false);
            jest.spyOn(Encryption, 'hashPassword').mockResolvedValue('hashedNew');
            userRepo.save.mockResolvedValue({ ...mockUser, password: 'hashedNew' });

            const res = await service.changePassword(1, dto);
            expect(res.message).toBe('Password changed successfully');
        });

        it('throws if current password invalid', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);
            jest.spyOn(Encryption, 'verifyPassword').mockResolvedValueOnce(false);
            await expect(service.changePassword(1, dto)).rejects.toThrow(ForbiddenException);
        });

        it('throws if new matches current', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);
            jest.spyOn(Encryption, 'verifyPassword').mockResolvedValue(true).mockResolvedValue(true);
            await expect(service.changePassword(1, dto)).rejects.toThrow(BadRequestException);
        });
    });

    // --- getAllUsers ---
    describe('getAllUsers', () => {
        it('returns users', async () => {
            userRepo.find.mockResolvedValue([mockUser]);
            const users = await service.getAllUsers();
            expect(users.length).toBe(1);
        });
    });

    // --- legacy update ---
    describe('update', () => {
        const dto: UpdateUserDTO = {
            firstName: 'New',
            lastName: 'Doe',
            gender: 'male',
            dob: new Date('1990-01-01'),
            phoneNumber: '1234567890',
            password: 'password123'
        };

        it('USER_UPDATEMYPROFILE_VALID_001 - updates profile successfully', async () => {
            userRepo.findOne.mockImplementation(({ where }: any) => {
                if (where.id === 1) return Promise.resolve({ ...mockUser, ...dto }); // getMyProfile after save
                if (where.phoneNumber === dto.phoneNumber) return Promise.resolve(null); // phone check
                return Promise.resolve(mockUser);
            });

            userRepo.save.mockResolvedValue({ ...mockUser, ...dto });

            const res = await service.updateMyProfile(1, dto);

            expect(res.message).toBe('Profile updated successfully');
            expect(res.user.firstName).toBe('New');
        });

    });

    // --- findByQuery ---
    describe('findByQuery', () => {
        it('searches users by email', async () => {
            const query = { email: 'john' };
            userRepo.find.mockResolvedValue([mockUser]);
            const result = await service.findByQuery(query);
            expect(result[0].email).toBe('john@example.com');
        });
    });
});