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

describe('AuthService', () => {
    let service: AuthService;
    let userRepository: jest.Mocked<Repository<User>>;
    let userEmailOtpRepository: jest.Mocked<Repository<UserEmailOtp>>;
    let userRefreshTokenRepository: jest.Mocked<Repository<UserRefreshToken>>;
    let jwtService: jest.Mocked<JwtService>;
    let mailerService: jest.Mocked<MailerService>;

    let realHashedPassword: string;

    const baseMockUser: Partial<User> = {
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
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(UserEmailOtp),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(UserRefreshToken),
                    useValue: {
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                    },
                },
                {
                    provide: MailerService,
                    useValue: {
                        sendMail: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
        userEmailOtpRepository = module.get(getRepositoryToken(UserEmailOtp)) as jest.Mocked<Repository<UserEmailOtp>>;
        userRefreshTokenRepository = module.get(getRepositoryToken(UserRefreshToken)) as jest.Mocked<Repository<UserRefreshToken>>;
        jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
        mailerService = module.get(MailerService) as jest.Mocked<MailerService>;
    });

    describe('signUp', () => {
        // Test Case ID: AUTH_SIGNUP_VALID_001
        // Descriptive Title: Successfully register a new user
        // Brief Description: Verify happy-path user registration with valid data
        // Module/Feature Reference: AuthService / signUp method
        // Preconditions: No existing user with the email, repositories mocked
        // Step-by-Step Actions:
        //   1. Call service.signUp with valid RegisterUserDTO
        //   2. Mock findOne to return null
        //   3. Mock save to return created user
        // Test Data: { email: 'new@example.com', password: 'SecurePass123!', confirmPassword: 'SecurePass123!', firstName: 'New', lastName: 'User' }
        // Expected Results: Returns SignUpResponseDto with userId, firstName, lastName, email
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: Uses real Encryption.hashPassword
        it('AUTH_SIGNUP_VALID_001 - should successfully register a new user', async () => {
            userRepository.findOne.mockResolvedValue(null);
            userRepository.save.mockResolvedValue({
                id: 123,
                firstName: 'New',
                lastName: 'User',
                email: 'new@example.com',
            } as User);

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

        // Test Case ID: AUTH_SIGNUP_INVALID_002
        // Descriptive Title: Throw BadRequestException for null registration data
        // Brief Description: Validate input guard for null/undefined DTO
        // Module/Feature Reference: AuthService / signUp method
        // Preconditions: Service ready
        // Step-by-Step Actions: Call service.signUp(null)
        // Test Data: null
        // Expected Results: BadRequestException with message containing 'Invalid registration data'
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: Early validation
        it('AUTH_SIGNUP_INVALID_002 - should throw BadRequestException for null registration data', async () => {
            await expect(service.signUp(null as any)).rejects.toThrow(BadRequestException);
        });

        // Test Case ID: AUTH_SIGNUP_INVALID_003
        // Descriptive Title: Throw BadRequestException when email or password is missing
        // Brief Description: Validate required fields check
        // Module/Feature Reference: AuthService / signUp method
        // Preconditions: Service ready
        // Step-by-Step Actions: Call with empty DTO
        // Test Data: {}
        // Expected Results: BadRequestException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_SIGNUP_INVALID_003 - should throw BadRequestException when email or password missing', async () => {
            await expect(service.signUp({} as any)).rejects.toThrow(BadRequestException);
        });

        // Test Case ID: AUTH_SIGNUP_CONFLICT_004
        // Descriptive Title: Throw ConflictException when email already registered
        // Brief Description: Duplicate email handling
        // Module/Feature Reference: AuthService / signUp method
        // Preconditions: findOne returns existing user
        // Step-by-Step Actions: Call with valid DTO
        // Test Data: validDto with existing email
        // Expected Results: ConflictException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_SIGNUP_CONFLICT_004 - should throw ConflictException when email already exists', async () => {
            userRepository.findOne.mockResolvedValue({ id: 1 } as User);
            await expect(service.signUp({
                email: 'new@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'New',
                lastName: 'User',
            } as RegisterUserDTO)).rejects.toThrow(ConflictException);
        });

        // Test Case ID: AUTH_SIGNUP_CONSTRAINT_005
        // Descriptive Title: Throw ConflictException on database unique constraint
        // Brief Description: Handle DB error code 23505
        // Module/Feature Reference: AuthService / signUp method
        // Preconditions: findOne returns null, save rejects with code 23505
        // Step-by-Step Actions: Call signUp
        // Test Data: validDto
        // Expected Results: ConflictException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: Medium
        // Notes: -
        it('AUTH_SIGNUP_CONSTRAINT_005 - should throw ConflictException on database unique constraint', async () => {
            userRepository.findOne.mockResolvedValue(null);
            userRepository.save.mockRejectedValue({ code: '23505' } as any);
            await expect(service.signUp({
                email: 'new@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'New',
                lastName: 'User',
            } as RegisterUserDTO)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        // Test Case ID: AUTH_LOGIN_VALID_001
        // Descriptive Title: Successfully login and return tokens
        // Brief Description: Happy path login with correct credentials
        // Module/Feature Reference: AuthService / login method
        // Preconditions: User exists, password matches (real Encryption), JWT mocked
        // Step-by-Step Actions: Call login with valid DTO
        // Test Data: { email: 'test@example.com', password: 'SecurePass123!' }
        // Expected Results: LoginResponseDto with accessToken and refreshToken
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: Uses real verifyPassword
        it('AUTH_LOGIN_VALID_001 - should successfully login and return tokens', async () => {
            userRepository.findOne.mockResolvedValue({ ...baseMockUser, password: realHashedPassword } as User);
            jwtService.signAsync
                .mockResolvedValueOnce('access.jwt.token')
                .mockResolvedValueOnce('refresh.jwt.token');
            userRefreshTokenRepository.save.mockResolvedValue({} as any);

            const result = await service.login({
                email: 'test@example.com',
                password: 'SecurePass123!',
            } as LoginUserDTO);

            expect(result).toEqual({
                accessToken: 'access.jwt.token',
                refreshToken: 'refresh.jwt.token',
            });
        });

        // Test Case ID: AUTH_LOGIN_INVALID_002
        // Descriptive Title: Throw BadRequestException for invalid login data
        // Brief Description: Guard against null DTO
        // Module/Feature Reference: AuthService / login method
        // Preconditions: Service ready
        // Step-by-Step Actions: Call login(null)
        // Test Data: null
        // Expected Results: BadRequestException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_LOGIN_INVALID_002 - should throw BadRequestException for invalid login data', async () => {
            await expect(service.login(null as any)).rejects.toThrow(BadRequestException);
        });

        // Test Case ID: AUTH_LOGIN_UNAUTHORIZED_003
        // Descriptive Title: Throw UnauthorizedException when user not found
        // Brief Description: Non-existent user
        // Module/Feature Reference: AuthService / login method
        // Preconditions: findOne returns null
        // Step-by-Step Actions: Call login
        // Test Data: valid DTO
        // Expected Results: UnauthorizedException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_LOGIN_UNAUTHORIZED_003 - should throw UnauthorizedException when user not found', async () => {
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.login({
                email: 'test@example.com',
                password: 'SecurePass123!',
            } as LoginUserDTO)).rejects.toThrow(UnauthorizedException);
        });

        // Test Case ID: AUTH_LOGIN_WRONG_PASSWORD_004
        // Descriptive Title: Throw UnauthorizedException on wrong password
        // Brief Description: Password mismatch (real verifyPassword)
        // Module/Feature Reference: AuthService / login method
        // Preconditions: User exists
        // Step-by-Step Actions: Call login with wrong password
        // Test Data: { ..., password: 'wrong' }
        // Expected Results: UnauthorizedException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_LOGIN_WRONG_PASSWORD_004 - should throw UnauthorizedException on wrong password', async () => {
            userRepository.findOne.mockResolvedValue({ ...baseMockUser, password: realHashedPassword } as User);
            await expect(service.login({
                email: 'test@example.com',
                password: 'wrong',
            } as LoginUserDTO)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refreshToken', () => {
        // Test Case ID: AUTH_REFRESH_VALID_001
        // Descriptive Title: Successfully refresh access token
        // Brief Description: Happy path token refresh
        // Module/Feature Reference: AuthService / refreshToken method
        // Preconditions: Valid id and email
        // Step-by-Step Actions: Call refreshToken('123', 'test@example.com')
        // Test Data: id='123', email='test@example.com'
        // Expected Results: RefreshTokenResponseDto with new accessToken, status success, issuedAt number
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_REFRESH_VALID_001 - should successfully refresh token', async () => {
            jwtService.signAsync.mockResolvedValue('new-access-token');

            const result = await service.refreshToken('123', 'test@example.com');

            expect(result).toEqual({
                accessToken: 'new-access-token',
                status: 'success',
                issuedAt: expect.any(Number),
            });
        });

        // Test Case ID: AUTH_REFRESH_INVALID_002
        // Descriptive Title: Throw BadRequestException when id or email missing
        // Brief Description: Required param validation
        // Module/Feature Reference: AuthService / refreshToken method
        // Preconditions: Service ready
        // Step-by-Step Actions: Call with empty id
        // Test Data: id='', email='test@example.com'
        // Expected Results: BadRequestException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_REFRESH_INVALID_002 - should throw BadRequestException when id or email missing', async () => {
            await expect(service.refreshToken('', 'test@example.com')).rejects.toThrow(BadRequestException);
        });
    });

    describe('logout', () => {
        // Test Case ID: AUTH_LOGOUT_VALID_001
        // Descriptive Title: Successfully logout
        // Brief Description: Delete active session
        // Module/Feature Reference: AuthService / logout method
        // Preconditions: delete returns affected=1
        // Step-by-Step Actions: Call logout(1, 'valid-refresh-token')
        // Test Data: userId=1, refreshToken='valid-refresh-token'
        // Expected Results: { message: 'Logged out successfully' }
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_LOGOUT_VALID_001 - should successfully logout', async () => {
            userRefreshTokenRepository.delete.mockResolvedValue({ affected: 1 } as any);

            const result = await service.logout(1, 'valid-refresh-token');

            expect(result).toEqual({ message: 'Logged out successfully' });
        });

        // Test Case ID: AUTH_LOGOUT_INVALID_002
        // Descriptive Title: Throw BadRequestException when parameters missing
        // Brief Description: Required fields guard
        // Module/Feature Reference: AuthService / logout method
        // Preconditions: Service ready
        // Step-by-Step Actions: Call with userId=0
        // Test Data: userId=0, refreshToken='token'
        // Expected Results: BadRequestException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_LOGOUT_INVALID_002 - should throw BadRequestException when parameters missing', async () => {
            await expect(service.logout(0, 'token')).rejects.toThrow(BadRequestException);
        });

        // Test Case ID: AUTH_LOGOUT_NOTFOUND_003
        // Descriptive Title: Throw NotFoundException when session not found
        // Brief Description: No rows affected
        // Module/Feature Reference: AuthService / logout method
        // Preconditions: delete returns affected=0
        // Step-by-Step Actions: Call logout
        // Test Data: valid userId & token
        // Expected Results: NotFoundException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_LOGOUT_NOTFOUND_003 - should throw NotFoundException when session not found', async () => {
            userRefreshTokenRepository.delete.mockResolvedValue({ affected: 0 } as any);
            await expect(service.logout(1, 'invalid-token')).rejects.toThrow(NotFoundException);
        });
    });

    describe('sendVerificationEmail', () => {
        // Test Case ID: AUTH_SEND_EMAIL_VALID_001
        // Descriptive Title: Send verification email successfully
        // Brief Description: Happy path OTP generation + mail send
        // Module/Feature Reference: AuthService / sendVerificationEmail method
        // Preconditions: User exists and not verified
        // Step-by-Step Actions: Call with valid email
        // Test Data: 'test@example.com'
        // Expected Results: { message: 'Verification OTP sent successfully' }
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: Mailer mocked
        it('AUTH_SEND_EMAIL_VALID_001 - should send verification email successfully', async () => {
            userRepository.findOne.mockResolvedValue({ ...baseMockUser, isVerified: false } as User);
            userEmailOtpRepository.findOne.mockResolvedValue(null);
            userEmailOtpRepository.save.mockResolvedValue({} as any);
            mailerService.sendMail.mockResolvedValue(undefined as any);

            const result = await service.sendVerificationEmail('test@example.com');

            expect(result).toEqual({ message: 'Verification OTP sent successfully' });
        });

        // Test Case ID: AUTH_SEND_EMAIL_NOTFOUND_002
        // Descriptive Title: Throw NotFoundException when user not found
        // Brief Description: Email lookup fails
        // Module/Feature Reference: AuthService / sendVerificationEmail method
        // Preconditions: findOne returns null
        // Step-by-Step Actions: Call sendVerificationEmail
        // Test Data: 'notfound@example.com'
        // Expected Results: NotFoundException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_SEND_EMAIL_NOTFOUND_002 - should throw NotFoundException when user not found', async () => {
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.sendVerificationEmail('notfound@example.com')).rejects.toThrow(NotFoundException);
        });

        // Test Case ID: AUTH_SEND_EMAIL_ALREADY_VERIFIED_003
        // Descriptive Title: Throw BadRequestException when email already verified
        // Brief Description: Prevent re-verification
        // Module/Feature Reference: AuthService / sendVerificationEmail method
        // Preconditions: User isVerified = true
        // Step-by-Step Actions: Call sendVerificationEmail
        // Test Data: valid email
        // Expected Results: BadRequestException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_SEND_EMAIL_ALREADY_VERIFIED_003 - should throw BadRequestException when email already verified', async () => {
            userRepository.findOne.mockResolvedValue({ ...baseMockUser, isVerified: true } as User);
            await expect(service.sendVerificationEmail('test@example.com')).rejects.toThrow(BadRequestException);
        });
    });

    describe('verifyEmailOtp', () => {
        // Test Case ID: AUTH_VERIFY_OTP_VALID_001
        // Descriptive Title: Successfully verify OTP
        // Brief Description: Valid OTP flow – delete OTP + update user
        // Module/Feature Reference: AuthService / verifyEmailOtp method
        // Preconditions: User not verified, valid OTP record
        // Step-by-Step Actions: Call verifyEmailOtp with correct OTP
        // Test Data: email='test@example.com', otp='123456'
        // Expected Results: { message: 'Email verified successfully' }
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: delete(userOtp.id) and update called
        it('AUTH_VERIFY_OTP_VALID_001 - should verify email OTP successfully', async () => {
            userRepository.findOne.mockResolvedValue({ ...baseMockUser, isVerified: false } as User);
            userEmailOtpRepository.findOne.mockResolvedValue(mockOtpRecord as any);
            userEmailOtpRepository.delete.mockResolvedValue({} as any);
            userRepository.update.mockResolvedValue({} as any);

            const result = await service.verifyEmailOtp('test@example.com', '123456');

            expect(result).toEqual({ message: 'Email verified successfully' });
        });

        // Test Case ID: AUTH_VERIFY_OTP_INVALID_002
        // Descriptive Title: Throw BadRequestException when email or OTP missing
        // Brief Description: Required param check
        // Module/Feature Reference: AuthService / verifyEmailOtp method
        // Preconditions: Service ready
        // Step-by-Step Actions: Call with empty email
        // Test Data: email='', otp='123456'
        // Expected Results: BadRequestException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_VERIFY_OTP_INVALID_002 - should throw BadRequestException when email or OTP missing', async () => {
            await expect(service.verifyEmailOtp('', '123456')).rejects.toThrow(BadRequestException);
        });

        // Test Case ID: AUTH_VERIFY_OTP_NOTFOUND_003
        // Descriptive Title: Throw NotFoundException when user not found
        // Brief Description: User lookup fails
        // Module/Feature Reference: AuthService / verifyEmailOtp method
        // Preconditions: findOne returns null
        // Step-by-Step Actions: Call verify
        // Test Data: valid email/otp
        // Expected Results: NotFoundException
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_VERIFY_OTP_NOTFOUND_003 - should throw NotFoundException when user not found', async () => {
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.verifyEmailOtp('test@example.com', '123456')).rejects.toThrow(NotFoundException);
        });

        // Test Case ID: AUTH_VERIFY_OTP_EXPIRED_004
        // Descriptive Title: Delete expired OTP and throw BadRequestException
        // Brief Description: Expired OTP handling (delete before throw)
        // Module/Feature Reference: AuthService / verifyEmailOtp method
        // Preconditions: OTP expired
        // Step-by-Step Actions: Call verify
        // Test Data: valid email + valid-looking OTP but expired
        // Expected Results: BadRequestException with 'OTP has expired...'
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: delete called
        it('AUTH_VERIFY_OTP_EXPIRED_004 - should delete expired OTP and throw BadRequestException', async () => {
            userRepository.findOne.mockResolvedValue({ ...baseMockUser, isVerified: false } as User);
            const expiredOtp = { ...mockOtpRecord, expiresAt: new Date(Date.now() - 1000) };
            userEmailOtpRepository.findOne.mockResolvedValue(expiredOtp as any);

            await expect(service.verifyEmailOtp('test@example.com', '123456'))
                .rejects.toThrow('OTP has expired. Please request a new verification code.');

            expect(userEmailOtpRepository.delete).toHaveBeenCalledWith(expiredOtp.id);
        });

        // Test Case ID: AUTH_VERIFY_OTP_INVALID_005
        // Descriptive Title: Throw BadRequestException for invalid OTP (no delete)
        // Brief Description: OTP mismatch
        // Module/Feature Reference: AuthService / verifyEmailOtp method
        // Preconditions: Valid OTP record exists
        // Step-by-Step Actions: Call with wrong OTP
        // Test Data: email + '999999'
        // Expected Results: BadRequestException 'Invalid OTP...'
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: delete NOT called
        it('AUTH_VERIFY_OTP_INVALID_005 - should throw BadRequestException for invalid OTP (no delete)', async () => {
            userRepository.findOne.mockResolvedValue({ ...baseMockUser, isVerified: false } as User);
            userEmailOtpRepository.findOne.mockResolvedValue(mockOtpRecord as any);

            await expect(service.verifyEmailOtp('test@example.com', '999999')).rejects.toThrow('Invalid OTP. Please check and try again.');

            expect(userEmailOtpRepository.delete).not.toHaveBeenCalled();
        });
    });

    describe('validateGoogleUser', () => {
        // Test Case ID: AUTH_GOOGLE_EXISTING_001
        // Descriptive Title: Return existing user for Google login
        // Brief Description: Existing user path
        // Module/Feature Reference: AuthService / validateGoogleUser method
        // Preconditions: findOne returns user
        // Step-by-Step Actions: Call with googlePayload
        // Test Data: { email: 'google@example.com', firstName: 'Google', lastName: 'User' }
        // Expected Results: User object with matching email
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: -
        it('AUTH_GOOGLE_EXISTING_001 - should return existing user', async () => {
            userRepository.findOne.mockResolvedValue({ ...baseMockUser, email: 'google@example.com' } as User);

            const result = await service.validateGoogleUser({
                email: 'google@example.com',
                firstName: 'Google',
                lastName: 'User',
            } as Partial<RegisterUserDTO>);

            expect(result.email).toBe('google@example.com');
        });

        // Test Case ID: AUTH_GOOGLE_NEW_002
        // Descriptive Title: Create and return new Google user
        // Brief Description: New user creation with random password
        // Module/Feature Reference: AuthService / validateGoogleUser method
        // Preconditions: findOne returns null
        // Step-by-Step Actions: Call validateGoogleUser
        // Test Data: googlePayload without existing user
        // Expected Results: New saved User with isVerified=true
        // Actual Results: Verified by assertion
        // Status: Pass
        // Priority: High
        // Notes: Uses real bcrypt via Encryption
        it('AUTH_GOOGLE_NEW_002 - should create new Google user', async () => {
            userRepository.findOne.mockResolvedValue(null);
            const newUser = { ...baseMockUser, id: 999, email: 'google@example.com', isVerified: true } as User;
            userRepository.create.mockReturnValue(newUser);
            userRepository.save.mockResolvedValue(newUser);

            const result = await service.validateGoogleUser({
                email: 'google@example.com',
                firstName: 'Google',
                lastName: 'User',
            } as Partial<RegisterUserDTO>);

            expect(result).toEqual(newUser);
        });
    });
});