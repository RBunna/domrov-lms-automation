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

import { AuthService } from '../src/modules/auth/auth.service';
import { User } from '../src/libs/entities/user/user.entity';
import { UserEmailOtp } from '../src/libs/entities/user/user-email-otp.entity';
import { UserRefreshToken } from '../src/libs/entities/user/user-refresh-token.entity';
import { RegisterUserDTO } from '../src/libs/dtos/user/register-user.dto';
import { LoginUserDTO } from '../src/libs/dtos/user/login.dto';
import { UserStatus } from '../src/libs/enums/Status';
import { Encryption } from '../src/libs/utils/Encryption';
import { UserService } from '../src/modules/user/user.service';

describe('AuthService - Comprehensive Testing with Detailed Logic Verification', () => {
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

    const mockOtpRecord = () => ({
        id: 10,
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        user: { id: 1 },
    });

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
                        updateUser: jest.fn(),
                        findById: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(UserEmailOtp),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        delete: jest.fn(),
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(UserRefreshToken),
                    useValue: {
                        save: jest.fn(),
                        delete: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                { provide: JwtService, useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() } },
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

    // ============================================================
    // SIGN UP
    // ============================================================
    describe('signUp - Comprehensive Registration Logic', () => {
        const validRegisterDto: RegisterUserDTO = {
            email: 'newuser@example.com',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!',
            firstName: 'New',
            lastName: 'User',
        } as RegisterUserDTO;

        describe('Input Validation', () => {
            it('SIGNUP_VALIDATE_001 - should reject null DTO', async () => {
                await expect(service.signUp(null as any)).rejects.toThrow(
                    'Registration data is required',
                );
            });

            it('SIGNUP_VALIDATE_002 - should reject undefined DTO', async () => {
                await expect(service.signUp(undefined as any)).rejects.toThrow(
                    BadRequestException,
                );
            });

            it('SIGNUP_VALIDATE_003 - should reject missing email', async () => {
                const invalidDto = { ...validRegisterDto, email: undefined };
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Email and password are required',
                );
            });

            it('SIGNUP_VALIDATE_004 - should reject empty email', async () => {
                const invalidDto = { ...validRegisterDto, email: '' };
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Email and password are required',
                );
            });

            it('SIGNUP_VALIDATE_005 - should reject invalid email format', async () => {
                const invalidDto = { ...validRegisterDto, email: 'not-an-email' };
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Invalid email format',
                );
            });

            it('SIGNUP_VALIDATE_006 - should reject missing password', async () => {
                const invalidDto = { ...validRegisterDto, password: undefined };
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Email and password are required',
                );
            });

            it('SIGNUP_VALIDATE_007 - should reject short password', async () => {
                const invalidDto = { ...validRegisterDto, password: 'Short1!', confirmPassword: 'Short1!' };
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Password must be at least 8 characters',
                );
            });

            it('SIGNUP_VALIDATE_008 - should reject password without uppercase', async () => {
                const invalidDto = { ...validRegisterDto, password: 'securepass123!', confirmPassword: 'securepass123!' };
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Password must contain uppercase',
                );
            });

            it('SIGNUP_VALIDATE_009 - should reject password without number', async () => {
                const invalidDto = { ...validRegisterDto, password: 'SecurePass!', confirmPassword: 'SecurePass!' };
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Password must contain number/digit',
                );
            });

            it('SIGNUP_VALIDATE_010 - should reject password without special character', async () => {
                const invalidDto = { ...validRegisterDto, password: 'SecurePass123', confirmPassword: 'SecurePass123' };
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Password must contain special character',
                );
            });

            it('SIGNUP_VALIDATE_011 - should reject missing firstName', async () => {
                const invalidDto = { ...validRegisterDto, firstName: undefined };
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'First name is required',
                );
            });

            it('SIGNUP_VALIDATE_012 - should reject missing lastName', async () => {
                const invalidDto = { ...validRegisterDto, lastName: undefined };
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.signUp(invalidDto as any)).rejects.toThrow(
                    'Last name is required',
                );
            });

            it('SIGNUP_VALIDATE_013 - should accept valid email formats', async () => {
                const validEmails = [
                    'user@example.com',
                    'user.name@example.com',
                    'user+tag@example.co.uk',
                    'user_123@example-domain.com',
                ];

                for (const email of validEmails) {
                    userService.findByEmail.mockResolvedValue(null);
                    userService.create.mockResolvedValue({ id: 1, email, firstName: 'Test', lastName: 'User' } as User);

                    const result = await service.signUp({ ...validRegisterDto, email } as RegisterUserDTO);
                    expect(result.email).toBe(email);
                }
            });
        });

        describe('Email Conflict Detection', () => {
            it('SIGNUP_CONFLICT_001 - should throw ConflictException when email exists', async () => {
                userService.findByEmail.mockResolvedValue({ id: 999 } as User);

                await expect(service.signUp(validRegisterDto)).rejects.toThrow(
                    'Email already registered',
                );
            });

            it('SIGNUP_CONFLICT_002 - should verify email lookup before creation', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({ id: 1, ...validRegisterDto } as unknown as User);

                await service.signUp(validRegisterDto);

                expect(userService.findByEmail).toHaveBeenCalledWith(validRegisterDto.email);
                expect(userService.findByEmail).toHaveBeenCalledTimes(1);
            });

            it('SIGNUP_CONFLICT_003 - should throw ConflictException type for existing email', async () => {
                userService.findByEmail.mockResolvedValue({ id: 1 } as User);

                await expect(service.signUp(validRegisterDto)).rejects.toThrow(ConflictException);
            });
        });

        describe('Password Hashing & Security', () => {
            it('SIGNUP_SECURITY_001 - should hash password before storage', async () => {
                const plainPassword = 'SecurePass123!';
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({ id: 1, email: 'test@example.com' } as User);

                await service.signUp({ ...validRegisterDto, password: plainPassword, confirmPassword: plainPassword } as RegisterUserDTO);

                const createCall = userService.create.mock.calls[0][0];
                expect(createCall.password).not.toBe(plainPassword);
                expect(createCall.password.length).toBeGreaterThan(20);
                expect(await Encryption.verifyPassword( createCall.password,plainPassword,)).toBe(true);
            });

            it('SIGNUP_SECURITY_002 - should create different hashes for same password (bcrypt salting)', async () => {
              const password = 'SecurePass123!';
              const hash1 = await Encryption.hashPassword(password);
              const hash2 = await Encryption.hashPassword(password);

              expect(hash1).not.toBe(hash2);
              expect(await Encryption.verifyPassword(hash1, password)).toBe(
                true,
              );
              expect(await Encryption.verifyPassword(hash2, password)).toBe(
                true,
              );
            });

            it('SIGNUP_SECURITY_003 - should not store plain password', async () => {
              userService.findByEmail.mockResolvedValue(null);
              const createSpy = userService.create.mockImplementation(
                async (data: Partial<User>) => ({ id: 1, ...data }) as User,
              );

              await service.signUp(validRegisterDto);

              const createCall = createSpy.mock.calls[0][0];
              expect(createCall.password).not.toContain('SecurePass123!');
              expect(createCall.password).toMatch(/^\$2[aby]\$/); // confirm it's a bcrypt hash
            });

            it('SIGNUP_SECURITY_004 - should produce a bcrypt hash of sufficient length', async () => {
                const hash = await Encryption.hashPassword('TestPassword123!');
                expect(hash.length).toBeGreaterThanOrEqual(50);
                expect(hash).toMatch(/^\$2[aby]\$/);
            });
        });

        describe('User Creation & Response', () => {
            it('SIGNUP_CREATE_001 - should create user with correct fields', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({
                    id: 123,
                    email: validRegisterDto.email,
                    firstName: validRegisterDto.firstName,
                    lastName: validRegisterDto.lastName,
                } as User);

                await service.signUp(validRegisterDto);

                const createCall = userService.create.mock.calls[0][0];
                expect(createCall.email).toBe(validRegisterDto.email);
                expect(createCall.firstName).toBe(validRegisterDto.firstName);
                expect(createCall.lastName).toBe(validRegisterDto.lastName);
            });

            it('SIGNUP_CREATE_002 - should return userId, email, firstName, lastName', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({
                    id: 123,
                    email: validRegisterDto.email,
                    firstName: validRegisterDto.firstName,
                    lastName: validRegisterDto.lastName,
                } as User);

                const result = await service.signUp(validRegisterDto);

                expect(result.userId).toBe(123);
                expect(result.email).toBe(validRegisterDto.email);
                expect(result.firstName).toBe(validRegisterDto.firstName);
                expect(result.lastName).toBe(validRegisterDto.lastName);
            });

            it('SIGNUP_CREATE_003 - should not include password in response', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({
                    id: 1,
                    email: validRegisterDto.email,
                    firstName: validRegisterDto.firstName,
                    lastName: validRegisterDto.lastName,
                } as User);

                const result = await service.signUp(validRegisterDto);

                expect(result).not.toHaveProperty('password');
            });

            it('SIGNUP_CREATE_004 - should propagate user creation failure', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockRejectedValue(new Error('Database error'));

                await expect(service.signUp(validRegisterDto)).rejects.toThrow('Database error');
            });
        });
    });

    // ============================================================
    // LOGIN
    // ============================================================
    describe('login - Comprehensive Authentication Logic', () => {
        const validLoginDto: LoginUserDTO = {
            email: 'test@example.com',
            password: 'SecurePass123!',
        } as LoginUserDTO;

        describe('Input Validation', () => {
            it('LOGIN_VALIDATE_001 - should reject null DTO', async () => {
                await expect(service.login(null as any)).rejects.toThrow(
                    'Email and password are required',
                );
            });

            it('LOGIN_VALIDATE_002 - should reject missing email', async () => {
                await expect(service.login({ password: 'SecurePass123!' } as LoginUserDTO)).rejects.toThrow(
                    'Email and password are required',
                );
            });

            it('LOGIN_VALIDATE_003 - should reject empty email', async () => {
                await expect(service.login({ email: '', password: 'SecurePass123!' } as LoginUserDTO)).rejects.toThrow(
                    'Email and password are required',
                );
            });

            it('LOGIN_VALIDATE_004 - should reject missing password', async () => {
                await expect(service.login({ email: 'test@example.com' } as LoginUserDTO)).rejects.toThrow(
                    'Email and password are required',
                );
            });

            it('LOGIN_VALIDATE_005 - should reject empty password', async () => {
                await expect(service.login({ email: 'test@example.com', password: '' } as LoginUserDTO)).rejects.toThrow(
                    'Email and password are required',
                );
            });
        });

        describe('User Lookup & Authentication', () => {
            it('LOGIN_AUTH_001 - should throw UnauthorizedException for non-existent user', async () => {
                userService.findByEmail.mockResolvedValue(null);

                await expect(service.login(validLoginDto)).rejects.toThrow(
                    'User not found with this email',
                );
            });

            it('LOGIN_AUTH_002 - should look up user by email exactly once', async () => {
                userService.findByEmail.mockResolvedValue(null);

                try { await service.login(validLoginDto); } catch (_) {}

                expect(userService.findByEmail).toHaveBeenCalledWith(validLoginDto.email);
                expect(userService.findByEmail).toHaveBeenCalledTimes(1);
            });
        });

        describe('Password Verification', () => {
            it('LOGIN_PASSWORD_001 - should throw UnauthorizedException for wrong password', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, password: realHashedPassword } as User);

                await expect(
                    service.login({ email: 'test@example.com', password: 'WrongPassword123!' } as LoginUserDTO),
                ).rejects.toThrow('Password Incorrect Please Try Again');
            });

            it('LOGIN_PASSWORD_002 - Encryption.verifyPassword correctly validates correct password', async () => {
                const isValid = await Encryption.verifyPassword( realHashedPassword,'SecurePass123!');
                expect(isValid).toBe(true);
            });

            it('LOGIN_PASSWORD_003 - should reject passwords that are close but not equal', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, password: realHashedPassword } as User);

                const wrongPasswords = ['SecurePass123', 'SecurePass124!', 'securepass123!', 'SecurePass123! '];

                for (const wrongPass of wrongPasswords) {
                    await expect(
                        service.login({ email: 'test@example.com', password: wrongPass } as LoginUserDTO),
                    ).rejects.toThrow(UnauthorizedException);
                }
            });

            it('LOGIN_PASSWORD_004 - should successfully authenticate with correct password', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.login(validLoginDto);

                expect(result).toHaveProperty('accessToken');
                expect(result).toHaveProperty('refreshToken');
            });
        });

        describe('JWT Token Generation', () => {
            it('LOGIN_JWT_001 - should call signAsync twice and return both tokens', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.login(validLoginDto);

                expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
                expect(result.accessToken).toBe('access.token');
                expect(result.refreshToken).toBe('refresh.token');
            });

            it('LOGIN_JWT_002 - should include user ID (sub) in token payload', async () => {
                const userId = 123;
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: userId, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.login(validLoginDto);

                expect(jwtService.signAsync.mock.calls[0][0]).toHaveProperty('sub', userId);
            });

            it('LOGIN_JWT_003 - should include email in token payload', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.login(validLoginDto);

                expect(jwtService.signAsync.mock.calls[0][0]).toHaveProperty('email', validLoginDto.email);
            });
        });

        describe('Refresh Token Storage', () => {
            it('LOGIN_REFRESH_001 - should save refresh token to database once', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.login(validLoginDto);

                expect(userRefreshTokenRepo.save).toHaveBeenCalledTimes(1);
            });

            it('LOGIN_REFRESH_002 - should store refresh token associated with user', async () => {
                const userId = 123;
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: userId, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.login(validLoginDto);

                const saveCall = userRefreshTokenRepo.save.mock.calls[0][0];
                expect(saveCall.user.id).toBe(userId);
                expect(saveCall.refreshToken).toBe('refresh.token');
            });

            it('LOGIN_REFRESH_003 - should store expiration date in the future', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.login(validLoginDto);

                const saveCall = userRefreshTokenRepo.save.mock.calls[0][0];
                expect(saveCall).toHaveProperty('expiresAt');
                expect(saveCall.expiresAt instanceof Date).toBe(true);
                expect((saveCall.expiresAt as Date).getTime()).toBeGreaterThan(Date.now());
            });
        });

        describe('Response Format', () => {
            it('LOGIN_RESPONSE_001 - should return exactly { accessToken, refreshToken }', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.login(validLoginDto);

                expect(result).toEqual({ accessToken: 'access.token', refreshToken: 'refresh.token' });
                expect(Object.keys(result).length).toBe(2);
            });

            it('LOGIN_RESPONSE_002 - should not include password in response', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.login(validLoginDto);

                expect(result).not.toHaveProperty('password');
                expect(JSON.stringify(result)).not.toContain('SecurePass123!');
            });
        });
    });

    // ============================================================
    // REFRESH TOKEN
    // ============================================================
    describe('refreshToken - Token Rotation & Verification', () => {
        describe('Input Validation', () => {
            it('REFRESH_VALIDATE_001 - should reject empty user ID', async () => {
                await expect(service.refreshToken('', 'test@example.com')).rejects.toThrow(
                    'User ID and email are required',
                );
            });

            it('REFRESH_VALIDATE_002 - should reject null user ID', async () => {
                await expect(service.refreshToken(null as any, 'test@example.com')).rejects.toThrow(
                    BadRequestException,
                );
            });

            it('REFRESH_VALIDATE_003 - should reject empty email', async () => {
                await expect(service.refreshToken('123', '')).rejects.toThrow(
                    'User ID and email are required',
                );
            });

            it('REFRESH_VALIDATE_004 - should reject null email', async () => {
                await expect(service.refreshToken('123', null as any)).rejects.toThrow(BadRequestException);
            });
        });

        describe('Token Generation', () => {
            it('REFRESH_TOKEN_001 - should generate new access token', async () => {
                jwtService.signAsync.mockResolvedValue('new-access-token');

                const result = await service.refreshToken('123', 'test@example.com');

                expect(result).toHaveProperty('accessToken', 'new-access-token');
            });

            it('REFRESH_TOKEN_002 - should include correct sub and email in token payload', async () => {
                jwtService.signAsync.mockResolvedValue('new-access-token');

                await service.refreshToken('123', 'test@example.com');

                expect(jwtService.signAsync.mock.calls[0][0]).toEqual({ sub: '123', email: 'test@example.com' });
            });
        });

        describe('Response Format & Metadata', () => {
            it('REFRESH_RESPONSE_001 - should return status: success', async () => {
                jwtService.signAsync.mockResolvedValue('new-access-token');

                const result = await service.refreshToken('123', 'test@example.com');

                expect(result).toHaveProperty('status', 'success');
            });

            it('REFRESH_RESPONSE_002 - should include numeric issuedAt timestamp', async () => {
                jwtService.signAsync.mockResolvedValue('new-access-token');
                const before = Date.now();

                const result = await service.refreshToken('123', 'test@example.com');

                const after = Date.now();
                expect(result).toHaveProperty('issuedAt');
                expect(typeof result.issuedAt).toBe('number');
                expect(result.issuedAt).toBeGreaterThanOrEqual(before);
                expect(result.issuedAt).toBeLessThanOrEqual(after);
            });

            it('REFRESH_RESPONSE_003 - should return exactly { accessToken, status, issuedAt }', async () => {
                jwtService.signAsync.mockResolvedValue('new-access-token');

                const result = await service.refreshToken('123', 'test@example.com');

                expect(Object.keys(result).sort()).toEqual(['accessToken', 'issuedAt', 'status'].sort());
            });

            it('REFRESH_RESPONSE_004 - should not include refreshToken in response', async () => {
                jwtService.signAsync.mockResolvedValue('new-access-token');

                const result = await service.refreshToken('123', 'test@example.com');

                expect(result).not.toHaveProperty('refreshToken');
            });
        });
    });

    // ============================================================
    // LOGOUT
    // ============================================================
    describe('logout - Session Termination & Verification', () => {
        describe('Input Validation', () => {
            it('LOGOUT_VALIDATE_001 - should reject null user ID', async () => {
                await expect(service.logout(null as any, 'token')).rejects.toThrow(
                    'User ID and refresh token are required',
                );
            });

            it('LOGOUT_VALIDATE_002 - should reject zero user ID (falsy)', async () => {
                await expect(service.logout(0, 'token')).rejects.toThrow(
                    'User ID and refresh token are required',
                );
            });

            it('LOGOUT_VALIDATE_003 - should reject null token', async () => {
                await expect(service.logout(1, null as any)).rejects.toThrow(
                    'User ID and refresh token are required',
                );
            });

            it('LOGOUT_VALIDATE_004 - should reject empty token', async () => {
                await expect(service.logout(1, '')).rejects.toThrow(
                    'User ID and refresh token are required',
                );
            });
        });

        describe('Token Deletion', () => {
            it('LOGOUT_DELETE_001 - should delete token and return success message', async () => {
                userRefreshTokenRepo.delete.mockResolvedValue({ affected: 1, raw: [] } as any);

                const result = await service.logout(1, 'token123');

                expect(userRefreshTokenRepo.delete).toHaveBeenCalledTimes(1);
                expect(result).toEqual({ message: 'Logged out successfully' });
            });

            it('LOGOUT_DELETE_002 - should query by user ID and refreshToken field', async () => {
                userRefreshTokenRepo.delete.mockResolvedValue({ affected: 1, raw: [] } as any);

                await service.logout(1, 'token123');

                expect(userRefreshTokenRepo.delete).toHaveBeenCalledWith({
                    user: { id: 1 },
                    refreshToken: 'token123',
                });
            });

            it('LOGOUT_DELETE_003 - should throw NotFoundException when session not found', async () => {
                userRefreshTokenRepo.delete.mockResolvedValue({ affected: 0, raw: [] } as any);

                await expect(service.logout(1, 'invalid-token')).rejects.toThrow(
                    'Session not found or already expired',
                );
            });

            it('LOGOUT_DELETE_004 - should throw NotFoundException type when session not found', async () => {
                userRefreshTokenRepo.delete.mockResolvedValue({ affected: 0, raw: [] } as any);

                await expect(service.logout(1, 'invalid-token')).rejects.toThrow(NotFoundException);
            });
        });

        describe('Error Handling', () => {
            it('LOGOUT_ERROR_001 - should propagate database errors', async () => {
                userRefreshTokenRepo.delete.mockRejectedValue(new Error('Database error'));

                await expect(service.logout(1, 'token123')).rejects.toThrow('Database error');
            });

            it('LOGOUT_ERROR_002 - affected 0 throws NotFoundException not generic error', async () => {
                userRefreshTokenRepo.delete.mockResolvedValue({ affected: 0, raw: [] } as any);

                await expect(service.logout(1, 'bad-token')).rejects.toThrow(NotFoundException);
            });
        });
    });

    // ============================================================
    // SEND VERIFICATION EMAIL
    // ============================================================
    describe('sendVerificationEmail - OTP Generation & Sending', () => {
        describe('User Not Found Cases', () => {
            it('EMAIL_VALIDATE_001 - null email results in NotFoundException', async () => {
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.sendVerificationEmail(null as any)).rejects.toThrow(NotFoundException);
            });

            it('EMAIL_VALIDATE_002 - empty email results in NotFoundException', async () => {
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.sendVerificationEmail('')).rejects.toThrow(NotFoundException);
            });
        });

        describe('User Verification Status', () => {
            it('EMAIL_STATUS_001 - should reject already verified users', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, isVerified: true } as User);

                await expect(service.sendVerificationEmail('test@example.com')).rejects.toThrow(
                    'Email is already verified',
                );
            });

            it('EMAIL_STATUS_002 - should accept unverified users and return success message', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(null);
                userEmailOtpRepo.create.mockReturnValue({ otp: '123456', expiresAt: new Date(), user: { id: 1 } } as any);
                userEmailOtpRepo.save.mockResolvedValue({} as any);
                mailerService.sendMail.mockResolvedValue(undefined as any);

                const result = await service.sendVerificationEmail('test@example.com');

                expect(result.message).toBe('Verification OTP sent successfully');
            });

            it('EMAIL_STATUS_003 - should throw NotFoundException for non-existent user', async () => {
                userService.findByEmail.mockResolvedValue(null);

                await expect(service.sendVerificationEmail('nonexistent@example.com')).rejects.toThrow(
                    'User with this email not found',
                );
            });
        });

        describe('OTP Generation & Timing', () => {
            it('EMAIL_OTP_001 - should generate 6-digit numeric OTP (100000-999999)', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(null);

                let capturedOtp: string | undefined;
                userEmailOtpRepo.create.mockImplementation((data?: any) => {
                    capturedOtp = data.otp;
                    return data;
                });
                userEmailOtpRepo.save.mockResolvedValue({} as any);
                mailerService.sendMail.mockResolvedValue(undefined as any);

                await service.sendVerificationEmail('test@example.com');

                expect(capturedOtp).toMatch(/^\d{6}$/);
                expect(parseInt(capturedOtp!)).toBeGreaterThanOrEqual(100000);
                expect(parseInt(capturedOtp!)).toBeLessThan(1000000);
            });

            it('EMAIL_OTP_002 - should set OTP expiration to ~10 minutes from now', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(null);

                let capturedExpiry: Date | undefined;
                userEmailOtpRepo.create.mockImplementation((data?: any) => {
                    capturedExpiry = data.expiresAt;
                    return data;
                });
                userEmailOtpRepo.save.mockResolvedValue({} as any);
                mailerService.sendMail.mockResolvedValue(undefined as any);

                const before = Date.now();
                await service.sendVerificationEmail('test@example.com');
                const after = Date.now();

                expect(capturedExpiry!.getTime()).toBeGreaterThanOrEqual(before + 9 * 60 * 1000);
                expect(capturedExpiry!.getTime()).toBeLessThanOrEqual(after + 11 * 60 * 1000);
            });

            it('EMAIL_OTP_003 - should update existing OTP record without deleting', async () => {
                const existingOtp = mockOtpRecord() as any;
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(existingOtp);
                userEmailOtpRepo.save.mockResolvedValue(existingOtp);
                mailerService.sendMail.mockResolvedValue(undefined as any);

                await service.sendVerificationEmail('test@example.com');

                const saveCall = userEmailOtpRepo.save.mock.calls[0][0];
                expect(saveCall.id).toBe(existingOtp.id);
                expect(saveCall.otp).toBeDefined();
                expect(userEmailOtpRepo.delete).not.toHaveBeenCalled();
            });

            it('EMAIL_OTP_004 - should create new OTP record when none exists', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(null);
                userEmailOtpRepo.create.mockReturnValue({ user: { id: 1 }, otp: '654321', expiresAt: new Date() } as any);
                userEmailOtpRepo.save.mockResolvedValue({} as any);
                mailerService.sendMail.mockResolvedValue(undefined as any);

                await service.sendVerificationEmail('test@example.com');

                expect(userEmailOtpRepo.create).toHaveBeenCalledTimes(1);
                expect(userEmailOtpRepo.save).toHaveBeenCalledTimes(1);
            });
        });

        describe('Email Sending', () => {
            it('EMAIL_SEND_001 - should call mailerService.sendMail once', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(null);
                userEmailOtpRepo.create.mockReturnValue({ otp: '123456', expiresAt: new Date(), user: { id: 1 } } as any);
                userEmailOtpRepo.save.mockResolvedValue({} as any);
                mailerService.sendMail.mockResolvedValue(undefined as any);

                await service.sendVerificationEmail('test@example.com');

                expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
            });

            it('EMAIL_SEND_002 - should send to correct address with Verification in subject', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(null);
                userEmailOtpRepo.create.mockReturnValue({ otp: '123456', expiresAt: new Date(), user: { id: 1 } } as any);
                userEmailOtpRepo.save.mockResolvedValue({} as any);
                mailerService.sendMail.mockResolvedValue(undefined as any);

                await service.sendVerificationEmail('test@example.com');

                const sendCall = mailerService.sendMail.mock.calls[0][0];
                expect(sendCall.to).toBe('test@example.com');
                expect(sendCall.subject).toContain('Verification');
            });

            it('EMAIL_SEND_003 - should propagate email sending failure', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(null);
                userEmailOtpRepo.create.mockReturnValue({ otp: '123456', expiresAt: new Date(), user: { id: 1 } } as any);
                userEmailOtpRepo.save.mockResolvedValue({} as any);
                mailerService.sendMail.mockRejectedValue(new Error('Email service error'));

                await expect(service.sendVerificationEmail('test@example.com')).rejects.toThrow('Email service error');
            });
        });
    });

    // ============================================================
    // VERIFY EMAIL OTP
    // ============================================================
    describe('verifyEmailOtp - OTP Validation & Verification', () => {
        describe('User Not Found Cases', () => {
            it('VERIFY_VALIDATE_001 - null email results in NotFoundException', async () => {
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.verifyEmailOtp(null as any, '123456')).rejects.toThrow(NotFoundException);
            });

            it('VERIFY_VALIDATE_002 - empty email results in NotFoundException', async () => {
                userService.findByEmail.mockResolvedValue(null);
                await expect(service.verifyEmailOtp('', '123456')).rejects.toThrow(NotFoundException);
            });
        });

        describe('User Lookup', () => {
            it('VERIFY_USER_001 - should throw NotFoundException for non-existent user', async () => {
                userService.findByEmail.mockResolvedValue(null);

                await expect(service.verifyEmailOtp('nonexistent@example.com', '123456')).rejects.toThrow(
                    'User with this email not found',
                );
            });

            it('VERIFY_USER_002 - should reject already verified users', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, isVerified: true } as User);

                await expect(service.verifyEmailOtp('test@example.com', '123456')).rejects.toThrow(
                    'Email is already verified',
                );
            });
        });

        describe('OTP Validation', () => {
            it('VERIFY_OTP_001 - should throw BadRequestException when OTP record not found', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(null);

                await expect(service.verifyEmailOtp('test@example.com', '123456')).rejects.toThrow(
                    'No OTP found. Please request a new verification code.',
                );
            });

            it('VERIFY_OTP_002 - should reject expired OTP', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue({
                    id: 10,
                    otp: '123456',
                    expiresAt: new Date(Date.now() - 1000),
                    user: { id: 1 },
                } as any);
                userEmailOtpRepo.delete.mockResolvedValue({ affected: 1, raw: [] } as any);

                await expect(service.verifyEmailOtp('test@example.com', '123456')).rejects.toThrow(
                    'OTP has expired. Please request a new verification code.',
                );
            });

            it('VERIFY_OTP_003 - should reject incorrect OTP value', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(mockOtpRecord() as any);

                await expect(service.verifyEmailOtp('test@example.com', '654321')).rejects.toThrow(
                    'Invalid OTP. Please check and try again.',
                );
            });

            it('VERIFY_OTP_004 - should accept valid, non-expired, correct OTP', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue({
                    id: 10,
                    otp: '123456',
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                    user: { id: 1 },
                } as any);
                userEmailOtpRepo.delete.mockResolvedValue({ affected: 1, raw: [] } as any);
                userService.verifyUser.mockResolvedValue({} as any);

                const result = await service.verifyEmailOtp('test@example.com', '123456');

                expect(result.message).toBe('Email verified successfully');
            });

            it('VERIFY_OTP_005 - should reject OTPs that are close but not exact', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);

                const validOtpRecord = {
                    id: 10,
                    otp: '123456',
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                    user: { id: 1 },
                };

                for (const wrongOtp of ['123455', '123457', '012345']) {
                    userEmailOtpRepo.findOne.mockResolvedValue(validOtpRecord as any);
                    await expect(service.verifyEmailOtp('test@example.com', wrongOtp)).rejects.toThrow(
                        'Invalid OTP. Please check and try again.',
                    );
                }
            });
        });

        describe('User Verification & Cleanup', () => {
            it('VERIFY_COMPLETE_001 - should call verifyUser with correct user ID', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(mockOtpRecord() as any);
                userEmailOtpRepo.delete.mockResolvedValue({ affected: 1, raw: [] } as any);
                userService.verifyUser.mockResolvedValue({} as any);

                await service.verifyEmailOtp('test@example.com', '123456');

                expect(userService.verifyUser).toHaveBeenCalledWith(1);
            });

            it('VERIFY_COMPLETE_002 - should delete OTP after successful verification', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(mockOtpRecord() as any);
                userEmailOtpRepo.delete.mockResolvedValue({ affected: 1, raw: [] } as any);
                userService.verifyUser.mockResolvedValue({} as any);

                await service.verifyEmailOtp('test@example.com', '123456');

                expect(userEmailOtpRepo.delete).toHaveBeenCalledTimes(1);
            });

            it('VERIFY_COMPLETE_003 - should return Email verified successfully', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
                userEmailOtpRepo.findOne.mockResolvedValue(mockOtpRecord() as any);
                userEmailOtpRepo.delete.mockResolvedValue({ affected: 1, raw: [] } as any);
                userService.verifyUser.mockResolvedValue({} as any);

                const result = await service.verifyEmailOtp('test@example.com', '123456');

                expect(result).toEqual({ message: 'Email verified successfully' });
            });
        });
    });

    // ============================================================
    // OAUTH LOGIN
    // ============================================================
    describe('oauthLogin - OAuth User Management & Token Generation', () => {
        describe('Input Validation', () => {
            it('OAUTH_VALIDATE_001 - should reject null profile', async () => {
                await expect(service.oauthLogin(null as any)).rejects.toThrow(
                    'OAuth user must have an email',
                );
            });

            it('OAUTH_VALIDATE_002 - should reject profile without email', async () => {
                await expect(service.oauthLogin({ firstName: 'Test', lastName: 'User' } as any)).rejects.toThrow(
                    'OAuth user must have an email',
                );
            });

            it('OAUTH_VALIDATE_003 - should accept profile with only email', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({ id: 1, email: 'oauth@example.com', isVerified: true } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.oauthLogin({ email: 'oauth@example.com' });

                expect(result).toHaveProperty('accessToken');
                expect(result).toHaveProperty('refreshToken');
            });
        });

        describe('New User Creation', () => {
            it('OAUTH_NEW_001 - should create new OAuth user when not found', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({
                    id: 999,
                    email: 'oauth@example.com',
                    firstName: 'OAuth',
                    lastName: 'User',
                    isVerified: true,
                } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.oauthLogin({ email: 'oauth@example.com', firstName: 'OAuth', lastName: 'User' });

                expect(userService.create).toHaveBeenCalledWith(
                    expect.objectContaining({ email: 'oauth@example.com', firstName: 'OAuth', lastName: 'User' }),
                );
            });

            it('OAUTH_NEW_002 - should set new OAuth user as verified', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({ id: 999, isVerified: true } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.oauthLogin({ email: 'oauth@example.com' });

                expect(userService.create.mock.calls[0][0].isVerified).toBe(true);
            });

            it('OAUTH_NEW_003 - should set new OAuth user status to ACTIVE', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({ id: 999, status: UserStatus.ACTIVE } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.oauthLogin({ email: 'oauth@example.com' });

                expect(userService.create.mock.calls[0][0].status).toBe(UserStatus.ACTIVE);
            });

            it('OAUTH_NEW_004 - should generate hashed random password for OAuth users', async () => {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({ id: 999 } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.oauthLogin({ email: 'oauth@example.com' });

                const pw = userService.create.mock.calls[0][0].password;
                expect(pw).toBeDefined();
                expect(pw).toMatch(/^\$2[aby]\$/);
            });
        });

        describe('Existing User Handling', () => {
            it('OAUTH_EXISTING_001 - should not call create for existing users', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, email: 'oauth@example.com' } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.oauthLogin({ email: 'oauth@example.com' });

                expect(userService.create).not.toHaveBeenCalled();
                expect(result).toHaveProperty('accessToken');
                expect(result).toHaveProperty('refreshToken');
            });

            it('OAUTH_EXISTING_002 - should look up user by email', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1 } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.oauthLogin({ email: 'oauth@example.com', firstName: 'Updated' });

                expect(userService.findByEmail).toHaveBeenCalledWith('oauth@example.com');
            });

            it('OAUTH_EXISTING_003 - should generate tokens for existing user', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 123 } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.oauthLogin({ email: 'oauth@example.com' });

                expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
                expect(result.accessToken).toBe('access.token');
                expect(result.refreshToken).toBe('refresh.token');
            });
        });

        describe('Token Generation for OAuth', () => {
            it('OAUTH_TOKEN_001 - should include user ID in token payload', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 999 } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.oauthLogin({ email: 'oauth@example.com' });

                expect(jwtService.signAsync.mock.calls[0][0]).toHaveProperty('sub', 999);
            });

            it('OAUTH_TOKEN_002 - should include email from DB user in token payload', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, email: 'test@example.com' } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.oauthLogin({ email: 'oauth@example.com' });

                expect(jwtService.signAsync.mock.calls[0][0]).toHaveProperty('email', 'test@example.com');
            });

            it('OAUTH_TOKEN_003 - should call signAsync exactly twice', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1 } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                await service.oauthLogin({ email: 'oauth@example.com' });

                expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
            });
        });

        describe('Response & Security', () => {
            it('OAUTH_RESPONSE_001 - should return exactly { accessToken, refreshToken }', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1 } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.oauthLogin({ email: 'oauth@example.com' });

                expect(result).toEqual({ accessToken: 'access.token', refreshToken: 'refresh.token' });
            });

            it('OAUTH_RESPONSE_002 - should not include password in response', async () => {
                userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
                jwtService.signAsync.mockResolvedValueOnce('access.token').mockResolvedValueOnce('refresh.token');
                userRefreshTokenRepo.save.mockResolvedValue({} as any);

                const result = await service.oauthLogin({ email: 'oauth@example.com' });

                expect(result).not.toHaveProperty('password');
                expect(JSON.stringify(result)).not.toContain('SecurePass');
            });
        });
    });

    // ============================================================
    // Edge Cases & Complex Scenarios
    // ============================================================
    describe('Edge Cases & Complex Scenarios', () => {
        it('EDGE_001 - should handle 5 rapid concurrent token refresh requests', async () => {
            jwtService.signAsync.mockResolvedValue('new-access-token');

            const results = await Promise.all(
                Array(5).fill(null).map(() => service.refreshToken('123', 'test@example.com')),
            );

            expect(results.length).toBe(5);
            expect(jwtService.signAsync).toHaveBeenCalledTimes(5);
            results.forEach((r) => {
                expect(r).toHaveProperty('accessToken');
                expect(r).toHaveProperty('status', 'success');
            });
        });

        it('EDGE_002 - should handle simultaneous login attempts independently', async () => {
            userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, password: realHashedPassword } as User);
            jwtService.signAsync
                .mockResolvedValueOnce('access1').mockResolvedValueOnce('refresh1')
                .mockResolvedValueOnce('access2').mockResolvedValueOnce('refresh2');
            userRefreshTokenRepo.save.mockResolvedValue({} as any);

            const results = await Promise.all(
                Array(2).fill(null).map(() =>
                    service.login({ email: 'test@example.com', password: 'SecurePass123!' } as LoginUserDTO),
                ),
            );

            expect(results.length).toBe(2);
            expect(userRefreshTokenRepo.save).toHaveBeenCalledTimes(2);
        });

        it('EDGE_003 - should handle special characters in email during signUp', async () => {
            const specialEmails = [
                'user+test@example.com',
                'user.name@example.com',
                'user_123@example.com',
                'user-name@example.co.uk',
            ];

            for (const email of specialEmails) {
                userService.findByEmail.mockResolvedValue(null);
                userService.create.mockResolvedValue({ id: 1, email } as User);

                const result = await service.signUp({
                    email,
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!',
                    firstName: 'Test',
                    lastName: 'User',
                } as RegisterUserDTO);

                expect(result.email).toBe(email);
            }
        });

        it('EDGE_004 - should handle very long passwords', async () => {
            const longPassword = 'A' + 'b'.repeat(98) + '1!';
            userService.findByEmail.mockResolvedValue(null);
            userService.create.mockResolvedValue({ id: 1, email: 'test@example.com' } as User);

            const result = await service.signUp({
                email: 'test@example.com',
                password: longPassword,
                confirmPassword: longPassword,
                firstName: 'Test',
                lastName: 'User',
            } as RegisterUserDTO);

            expect(result).toHaveProperty('userId');
        });

        it('EDGE_005 - concurrent OTP verification: second attempt fails after OTP deleted', async () => {
            userService.findByEmail.mockResolvedValue({ ...baseUser, id: 1, isVerified: false } as User);
            userEmailOtpRepo.findOne
                .mockResolvedValueOnce(mockOtpRecord() as any)
                .mockResolvedValueOnce(null);
            userEmailOtpRepo.delete.mockResolvedValue({ affected: 1, raw: [] } as any);
            userService.verifyUser.mockResolvedValue({} as any);

            const result1 = await service.verifyEmailOtp('test@example.com', '123456');
            expect(result1).toHaveProperty('message');

            await expect(service.verifyEmailOtp('test@example.com', '123456')).rejects.toThrow(
                'No OTP found. Please request a new verification code.',
            );
        });
    });
});