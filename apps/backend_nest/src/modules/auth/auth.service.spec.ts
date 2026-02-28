import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { User } from '../../libs/entities/user/user.entity';
import { UserEmailOtp } from '../../libs/entities/user/user-email-otp.entity';
import { UserRefreshToken } from '../../libs/entities/user/user-refresh-token.entity';
import { RegisterUserDTO } from '../../libs/dtos/user/register-user.dto';
import { LoginUserDTO } from '../../libs/dtos/user/login.dto';
import { UserStatus } from '../../libs/enums/Status';
import { Encryption } from '../../libs/utils/Encryption';   // Real util - NO mock
import { UserService } from '../user/user.service';

describe('AuthService', () => {
    let service: AuthService;
    let userService: jest.Mocked<UserService>;
    let userEmailOtpRepo: jest.Mocked<Repository<UserEmailOtp>>;
    let userRefreshTokenRepo: jest.Mocked<Repository<UserRefreshToken>>;
    let jwtService: jest.Mocked<JwtService>;
    let mailerService: jest.Mocked<MailerService>;

    let realHashedPassword: string;

    const baseUser: Partial<User> = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isVerified: false,
        status: UserStatus.ACTIVE,
    };

    const mockOtpRecord = {
        id: 10,
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        user: { id: 1 },
    };

    beforeAll(async () => {
        realHashedPassword = await Encryption.hashPassword('SecurePass123!');
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: {
                        findByEmail: jest.fn(),
                        create: jest.fn(),
                        verifyUser: jest.fn(),
                        validateOAuthUser: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(UserEmailOtp),
                    useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn(), delete: jest.fn() },
                },
                {
                    provide: getRepositoryToken(UserRefreshToken),
                    useValue: { save: jest.fn(), delete: jest.fn() },
                },
                { provide: JwtService, useValue: { signAsync: jest.fn() } },
                { provide: MailerService, useValue: { sendMail: jest.fn() } },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userService = module.get(UserService) as jest.Mocked<UserService>;
        userEmailOtpRepo = module.get(getRepositoryToken(UserEmailOtp)) as jest.Mocked<Repository<UserEmailOtp>>;
        userRefreshTokenRepo = module.get(getRepositoryToken(UserRefreshToken)) as jest.Mocked<Repository<UserRefreshToken>>;
        jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
        mailerService = module.get(MailerService) as jest.Mocked<MailerService>;
    });

    // ------------------- SIGN UP -------------------
    describe('signUp', () => {
        it('AUTH_SIGNUP_VALID_001 - should register new user', async () => {
            userService.findByEmail.mockResolvedValue(null);
            userService.create.mockResolvedValue({ id: 123, firstName: 'New', lastName: 'User', email: 'new@example.com' } as User);

            const result = await service.signUp({
                email: 'new@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'New',
                lastName: 'User',
            } as RegisterUserDTO);

            expect(result).toEqual({
                userId: 123,
                firstName: 'New',
                lastName: 'User',
                email: 'new@example.com',
            });
        });

        it('AUTH_SIGNUP_INVALID_002 - should throw BadRequestException for null DTO', async () => {
            await expect(service.signUp(null as any)).rejects.toThrow(BadRequestException);
        });

        it('AUTH_SIGNUP_CONFLICT_004 - should throw ConflictException if email exists', async () => {
            userService.findByEmail.mockResolvedValue({ id: 1 } as User);
            await expect(service.signUp({
                email: 'new@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'New',
                lastName: 'User',
            } as RegisterUserDTO)).rejects.toThrow(ConflictException);
        });
    });

    // ------------------- LOGIN -------------------
    describe('login', () => {
        it('AUTH_LOGIN_VALID_001 - should login successfully', async () => {
            userService.findByEmail.mockResolvedValue({ ...baseUser, password: realHashedPassword } as User);
            jwtService.signAsync.mockResolvedValueOnce('access.jwt.token').mockResolvedValueOnce('refresh.jwt.token');
            userRefreshTokenRepo.save.mockResolvedValue({} as any);

            const result = await service.login({
                email: 'test@example.com',
                password: 'SecurePass123!',
            } as LoginUserDTO);

            expect(result).toEqual({ accessToken: 'access.jwt.token', refreshToken: 'refresh.jwt.token' });
        });

        it('AUTH_LOGIN_UNAUTHORIZED_003 - should throw UnauthorizedException for non-existent user', async () => {
            userService.findByEmail.mockResolvedValue(null);
            await expect(service.login({ email: 'test@example.com', password: 'SecurePass123!' } as LoginUserDTO))
                .rejects.toThrow(UnauthorizedException);
        });

        it('AUTH_LOGIN_WRONG_PASSWORD_004 - should throw UnauthorizedException on wrong password', async () => {
            userService.findByEmail.mockResolvedValue({ ...baseUser, password: realHashedPassword } as User);
            await expect(service.login({ email: 'test@example.com', password: 'wrong' } as LoginUserDTO))
                .rejects.toThrow(UnauthorizedException);
        });
    });

    // ------------------- REFRESH TOKEN -------------------
    describe('refreshToken', () => {
        it('AUTH_REFRESH_VALID_001 - should refresh token', async () => {
            jwtService.signAsync.mockResolvedValue('new-access-token');

            const result = await service.refreshToken('123', 'test@example.com');
            expect(result).toEqual({ accessToken: 'new-access-token', status: 'success', issuedAt: expect.any(Number) });
        });

        it('AUTH_REFRESH_INVALID_002 - should throw BadRequestException when id missing', async () => {
            await expect(service.refreshToken('', 'test@example.com')).rejects.toThrow(BadRequestException);
        });
    });

    // ------------------- LOGOUT -------------------
    describe('logout', () => {
        it('AUTH_LOGOUT_VALID_001 - should logout successfully', async () => {
            userRefreshTokenRepo.delete.mockResolvedValue({ affected: 1 } as any);
            const result = await service.logout(1, 'token');
            expect(result).toEqual({ message: 'Logged out successfully' });
        });

        it('AUTH_LOGOUT_NOTFOUND_003 - should throw NotFoundException', async () => {
            userRefreshTokenRepo.delete.mockResolvedValue({ affected: 0 } as any);
            await expect(service.logout(1, 'token')).rejects.toThrow(NotFoundException);
        });
    });

    // ------------------- EMAIL VERIFICATION -------------------
    describe('sendVerificationEmail', () => {
        it('AUTH_SEND_EMAIL_VALID_001 - should send verification OTP', async () => {
            userService.findByEmail.mockResolvedValue({ ...baseUser, isVerified: false } as User);
            userEmailOtpRepo.findOne.mockResolvedValue(null);
            userEmailOtpRepo.save.mockResolvedValue({} as any);
            mailerService.sendMail.mockResolvedValue(undefined as any);

            const result = await service.sendVerificationEmail('test@example.com');
            expect(result).toEqual({ message: 'Verification OTP sent successfully' });
        });
    });

    describe('verifyEmailOtp', () => {
        it('AUTH_VERIFY_OTP_VALID_001 - should verify OTP successfully', async () => {
            userService.findByEmail.mockResolvedValue({ ...baseUser, isVerified: false } as User);
            userEmailOtpRepo.findOne.mockResolvedValue(mockOtpRecord as any);
            userEmailOtpRepo.delete.mockResolvedValue({} as any);
            userService.verifyUser.mockResolvedValue({} as any);

            const result = await service.verifyEmailOtp('test@example.com', '123456');
            expect(result).toEqual({ message: 'Email verified successfully' });
        });
    });

    // ------------------- GOOGLE OAUTH -------------------
    describe('oauthLogin', () => {
        it('AUTH_OAUTH_NEW_001 - should create new OAuth user', async () => {
            userService.findByEmail.mockResolvedValue(null);
            const newUser = { id: 999, email: 'oauth@example.com', isVerified: true } as User;
            userService.create.mockResolvedValue(newUser);
            jwtService.signAsync.mockResolvedValueOnce('access.jwt.token').mockResolvedValueOnce('refresh.jwt.token');
            userRefreshTokenRepo.save.mockResolvedValue({} as any);

            const result = await service.oauthLogin({ email: 'oauth@example.com', firstName: 'OAuth', lastName: 'User' });
            expect(result).toEqual({ accessToken: 'access.jwt.token', refreshToken: 'refresh.jwt.token' });
        });

        it('AUTH_OAUTH_EXISTING_002 - should return existing user tokens', async () => {
            const existingUser = { ...baseUser, id: 1 } as User;
            userService.findByEmail.mockResolvedValue(existingUser);
            jwtService.signAsync.mockResolvedValueOnce('access.jwt.token').mockResolvedValueOnce('refresh.jwt.token');
            userRefreshTokenRepo.save.mockResolvedValue({} as any);

            const result = await service.oauthLogin({ email: 'test@example.com' });
            expect(result).toEqual({ accessToken: 'access.jwt.token', refreshToken: 'refresh.jwt.token' });
        });
    });
});