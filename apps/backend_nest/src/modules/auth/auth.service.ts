import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../libs/entities/user/user.entity';
import { RegisterUserDTO } from '../../libs/dtos/user/register-user.dto';
import { Encryption } from '../../libs/utils/Encryption';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDTO } from '../../libs/dtos/user/login.dto';
import { UserRefreshToken } from '../../libs/entities/user/user-refresh-token.entity';
import { UserEmailOtp } from '../../libs/entities/user/user-email-otp.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { UserStatus } from '../../libs/enums/Status';
import * as bcrypt from 'bcrypt';
import { SignUpResponseDto } from '../../libs/dtos/auth/sign-up-response.dto';
import { LoginResponseDto } from '../../libs/dtos/auth/login-response.dto';
import { RefreshTokenResponseDto } from '../../libs/dtos/auth/refresh-token-response.dto';
import { MessageResponseDto } from '../../libs/dtos/common/message-response.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(UserEmailOtp)
        private readonly userEmailOtpRepository: Repository<UserEmailOtp>,

        @InjectRepository(UserRefreshToken)
        private readonly userRefreshTokenRepository: Repository<UserRefreshToken>,

        private readonly accessJwtService: JwtService,

        private readonly refreshJwtService: JwtService,

        private readonly mailerService: MailerService,

    ) { }

    async signUp(signUpUserDto: RegisterUserDTO): Promise<SignUpResponseDto> {
        // Check if email already exists
        const existingUser = await this.userRepository.findOne({ 
            where: { email: signUpUserDto.email } 
        });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        signUpUserDto.password = await Encryption.hashPassword(signUpUserDto.password);
        const { confirmPassword, ...userData } = signUpUserDto;
        
        try {
            const createdUser = await this.userRepository.save(userData);
            return {
                userId: createdUser.id,
                firstName: createdUser.firstName,
                lastName: createdUser.lastName,
                email: createdUser.email
            };
        } catch (error) {
            const errorCode = (error as any).code;
            if (errorCode === '23505' || errorCode === 11000) {
                throw new ConflictException('Email already registered');
            } else if ((error as any).name === 'ValidationError') {
                throw new BadRequestException('Validation failed. Please check your input.');
            } else {
                throw new InternalServerErrorException('Failed to create user. Please try again later.');
            }
        }
    }

    async login(login: LoginUserDTO): Promise<LoginResponseDto> {
        const user = await this.userRepository.findOne({ where: { email: login.email } });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        
        const passwordMatches = await Encryption.verifyPassword(user.password, login.password);
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password');
        }
        
        const payload = { sub: user.id, email: user.email };

        const accessToken = await this.accessJwtService.signAsync(payload);
        const refreshToken = await this.refreshJwtService.signAsync(payload);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.userRefreshTokenRepository.save({
            user,
            refreshToken: refreshToken,
            expiresAt: expiresAt
        });

        return { accessToken, refreshToken };
    }

    async refreshToken(id: string, email: string): Promise<RefreshTokenResponseDto> {
        const accessToken = await this.refreshJwtService.signAsync(
            { sub: id, email }
        );
    return { accessToken, status: 'success', issuedAt: Date.now() };    }

    async logout(userId: number, refreshToken: string): Promise<MessageResponseDto> {
        const result = await this.userRefreshTokenRepository.delete({
            user: { id: userId },
            refreshToken: refreshToken,
        });

        if (result.affected === 0) {
            throw new NotFoundException('Session not found or already expired');
        }

        return { message: 'Logged out successfully' };
    }

    async sendVerificationEmail(email: string): Promise<MessageResponseDto> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User with this email not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('Email is already verified');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        let userOtp = await this.userEmailOtpRepository.findOne({
            where: { user: { id: user.id } },
        });

        if (userOtp) {
            userOtp.otp = otp;
            userOtp.expiresAt = expiresAt;
        } else {
            userOtp = this.userEmailOtpRepository.create({ user, otp, expiresAt });
        }
        await this.userEmailOtpRepository.save(userOtp);

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Your Email Verification OTP',
                text: `Your OTP is: ${otp}`,
                html: `<p>Your OTP is: <b>${otp}</b></p>`,
            });
        } catch (error) {
            throw new InternalServerErrorException('Failed to send verification email. Please try again later.');
        }

        return { message: 'Verification OTP sent successfully' };
    }



    async verifyEmailOtp(email: string, otp: string): Promise<MessageResponseDto> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User with this email not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('Email is already verified');
        }

        const userOtp = await this.userEmailOtpRepository.findOne({
            where: { user: { id: user.id } },
        });

        if (!userOtp) {
            throw new BadRequestException('No OTP found. Please request a new verification code.');
        }

        if (userOtp.expiresAt < new Date()) {
            await this.userEmailOtpRepository.delete(userOtp.id);
            throw new BadRequestException('OTP has expired. Please request a new verification code.');
        }

        if (otp !== userOtp.otp) {
            throw new BadRequestException('Invalid OTP. Please check and try again.');
        }

        await this.userEmailOtpRepository.delete(userOtp.id);
        await this.userRepository.update(user.id, { isVerified: true });

        return { message: 'Email verified successfully' };
    }

    async validateGoogleUser(googleUser: Partial<RegisterUserDTO>): Promise<User> {
        console.log('Checking Google user:', googleUser.email);

        let user = await this.userRepository.findOne({ where: { email: googleUser.email } });

        if (user) {
            console.log('Found existing user:', user.id);
            return user;
        }

        console.log('Creating new Google user...');

        const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

        user = this.userRepository.create({
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            gender: googleUser.gender ?? undefined,
            email: googleUser.email,
            password: randomPassword,
            profilePictureUrl: googleUser.profilePictureUrl ?? undefined,
            isVerified: true,
            status: UserStatus.ACTIVE,
        });

        const saved = await this.userRepository.save(user);
        console.log('Saved new user:', saved);

        return saved;
    }



}
