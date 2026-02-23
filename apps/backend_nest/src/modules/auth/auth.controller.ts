import { Body, Controller, Post, Req, Res, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { 
    ApiTags, 
    ApiOperation, 
    ApiBody, 
    ApiOkResponse, 
    ApiCreatedResponse, 
    ApiBadRequestResponse, 
    ApiUnauthorizedResponse, 
    ApiNotFoundResponse,
    ApiConflictResponse,
    ApiInternalServerErrorResponse,
    ApiBearerAuth,
    ApiCookieAuth
} from '@nestjs/swagger';
import { RegisterUserDTO } from '../../libs/dtos/user/register-user.dto';
import { LoginUserDTO } from '../../libs/dtos/user/login.dto';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ResendOtpDTO, VerifyOtpDTO } from '../../libs/dtos/user/email-verification.dto';
import { SignUpResponseDto } from '../../libs/dtos/auth/sign-up-response.dto';
import { LoginResponseDto } from '../../libs/dtos/auth/login-response.dto';
import { RefreshTokenResponseDto } from '../../libs/dtos/auth/refresh-token-response.dto';
import { MessageResponseDto } from '../../libs/dtos/common/message-response.dto';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    // ==================== SIGN UP ====================
    @Post('sign-up')
    @ApiOperation({ 
        summary: 'Register a new user',
        description: 'Creates a new user account with the provided credentials. Email must be unique.'
    })
    @ApiBody({ 
        type: RegisterUserDTO,
        description: 'User registration details',
        examples: {
            example1: {
                summary: 'Standard registration',
                value: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!',
                    gender: 'Male',
                    profilePictureUrl: 'https://example.com/avatar.jpg'
                }
            }
        }
    })
    @ApiCreatedResponse({ 
        description: 'User registered successfully',
        type: SignUpResponseDto,
        example: {
            userId: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
        }
    })
    @ApiConflictResponse({ 
        description: 'Email already registered',
        example: {
            statusCode: 409,
            message: 'Email already registered',
            error: 'Conflict'
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Validation failed',
        example: {
            statusCode: 400,
            message: 'Validation failed. Please check your input.',
            error: 'Bad Request'
        }
    })
    @ApiInternalServerErrorResponse({
        description: 'Failed to create user',
        example: {
            statusCode: 500,
            message: 'Failed to create user. Please try again later.',
            error: 'Internal Server Error'
        }
    })
    async signUp(@Body() createUserDto: RegisterUserDTO): Promise<SignUpResponseDto> {
        return this.authService.signUp(createUserDto);
    }

    // ==================== LOGIN ====================
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Login to the system',
        description: 'Authenticates user credentials and returns access token. Refresh token is set as HTTP-only cookie.'
    })
    @ApiBody({ 
        type: LoginUserDTO,
        description: 'User login credentials',
        examples: {
            example1: {
                summary: 'Standard login',
                value: {
                    email: 'john.doe@example.com',
                    password: 'password123'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Login successful',
        schema: {
            type: 'object',
            properties: {
                accessToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
            }
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'Invalid email or password',
        example: {
            statusCode: 401,
            message: 'Invalid email or password',
            error: 'Unauthorized'
        }
    })
    async login(
        @Req() req: Request, 
        @Res({ passthrough: true }) res: Response, 
        @Body() loginDto: LoginUserDTO
    ) {
        const { refreshToken, ...loginResponse } = await this.authService.login(loginDto);
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return loginResponse;
    }

    // ==================== REFRESH TOKEN ====================
    @Post('refresh-token')
    @UseGuards(AuthGuard('refresh-jwt'))
    @HttpCode(HttpStatus.OK)
    @ApiCookieAuth('refresh_token')
    @ApiOperation({ 
        summary: 'Refresh access token',
        description: 'Issues a new access token using the refresh token from HTTP-only cookie.'
    })
    @ApiOkResponse({ 
        description: 'Token refreshed successfully',
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    example: 'success'
                },
                accessToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                issuedAt: {
                    type: 'number',
                    example: 1704067200
                }
            }
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'Invalid or expired refresh token',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
        const user = req.user;
        const { accessToken } = await this.authService.refreshToken(user.id, user.email);
        const issuedAt = Math.floor(Date.now() / 1000);
        return {
            status: 'success',
            accessToken,
            issuedAt
        };
    }

    // ==================== LOGOUT ====================
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Logout from current device',
        description: 'Invalidates the current refresh token and clears the HTTP-only cookie.'
    })
    @ApiOkResponse({ 
        description: 'Logged out successfully',
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    example: 'success'
                },
                message: {
                    type: 'string',
                    example: 'Logged out from current device'
                }
            }
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Session not found or already expired',
        example: {
            statusCode: 404,
            message: 'Session not found or already expired',
            error: 'Not Found'
        }
    })
    async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
        const user = req.user;
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) {
            throw new Error('Refresh token missing');
        }
        await this.authService.logout(user.id, refreshToken);
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        return { status: 'success', message: 'Logged out from current device' };
    }

    // ==================== VERIFY EMAIL ====================
    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Verify user email with OTP',
        description: 'Verifies user email address using the OTP sent to their email.'
    })
    @ApiBody({ 
        type: VerifyOtpDTO,
        description: 'Email verification details',
        examples: {
            example1: {
                summary: 'Verify OTP',
                value: {
                    email: 'john.doe@example.com',
                    otp: '123456'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Email verified successfully',
        type: MessageResponseDto,
        example: {
            message: 'Email verified successfully'
        }
    })
    @ApiNotFoundResponse({ 
        description: 'User not found',
        example: {
            statusCode: 404,
            message: 'User with this email not found',
            error: 'Not Found'
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Invalid or expired OTP',
        examples: {
            alreadyVerified: {
                summary: 'Email already verified',
                value: {
                    statusCode: 400,
                    message: 'Email is already verified',
                    error: 'Bad Request'
                }
            },
            noOtp: {
                summary: 'No OTP found',
                value: {
                    statusCode: 400,
                    message: 'No OTP found. Please request a new verification code.',
                    error: 'Bad Request'
                }
            },
            expiredOtp: {
                summary: 'OTP expired',
                value: {
                    statusCode: 400,
                    message: 'OTP has expired. Please request a new verification code.',
                    error: 'Bad Request'
                }
            },
            invalidOtp: {
                summary: 'Invalid OTP',
                value: {
                    statusCode: 400,
                    message: 'Invalid OTP. Please check and try again.',
                    error: 'Bad Request'
                }
            }
        }
    })
    async verifyOtp(@Body() body: VerifyOtpDTO): Promise<MessageResponseDto> {
        return this.authService.verifyEmailOtp(body.email, body.otp);
    }

    // ==================== RESEND VERIFICATION OTP ====================
    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Resend OTP email for verification',
        description: 'Sends a new verification OTP to the user\'s email address.'
    })
    @ApiBody({ 
        type: ResendOtpDTO,
        description: 'Email address to resend OTP',
        examples: {
            example1: {
                summary: 'Resend OTP',
                value: {
                    email: 'john.doe@example.com'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'OTP sent successfully',
        type: MessageResponseDto,
        example: {
            message: 'Verification OTP sent successfully'
        }
    })
    @ApiNotFoundResponse({ 
        description: 'User not found',
        example: {
            statusCode: 404,
            message: 'User with this email not found',
            error: 'Not Found'
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Email already verified',
        example: {
            statusCode: 400,
            message: 'Email is already verified',
            error: 'Bad Request'
        }
    })
    @ApiInternalServerErrorResponse({
        description: 'Failed to send email',
        example: {
            statusCode: 500,
            message: 'Failed to send verification email. Please try again later.',
            error: 'Internal Server Error'
        }
    })
    async resendOtp(@Body() body: ResendOtpDTO): Promise<MessageResponseDto> {
        return this.authService.sendVerificationEmail(body.email);
    }

    // ==================== GOOGLE AUTH ====================
    @Get('google/login')
    @ApiOperation({ 
        summary: 'Initiate Google OAuth login',
        description: 'Redirects to Google OAuth consent screen for authentication.'
    })
    @ApiOkResponse({ 
        description: 'Redirects to Google OAuth'
    })
    async googleLogin() {
        // Handled by Google OAuth guard
    }

    @Get('google/callback')
    @ApiOperation({ 
        summary: 'Google OAuth callback',
        description: 'Handles the callback from Google OAuth and creates/authenticates the user.'
    })
    @ApiOkResponse({ 
        description: 'Google login successful',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Google login successful!'
                },
                user: {
                    type: 'object',
                    description: 'User information from Google'
                }
            }
        }
    })
    async googleCallback(@Req() req) {
        return {
            message: 'Google login successful!',
            user: req.user,
        };
    }
}
