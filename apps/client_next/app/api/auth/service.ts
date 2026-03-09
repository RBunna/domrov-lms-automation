import axiosInstance, { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    RegisterUserDTO,
    LoginUserDTO,
    SignUpResponseDto,
    LoginResponseDto,
    RefreshTokenResponseDto,
    AuthMessageResponseDto,
    VerifyOtpDTO,
    ResendOtpDTO,
    MessageResponseDto,
    ApiResponse
} from './dto';

/**
 * Register a new user account
 */
export async function signUp(data: RegisterUserDTO): Promise<ApiResponse<SignUpResponseDto>> {
    try {
        const response = await axiosInstance.post<ApiResponse<SignUpResponseDto>>('/auth/sign-up', data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Login user with email and password
 */
export async function login(data: LoginUserDTO): Promise<ApiResponse<LoginResponseDto>> {
    try {
        const response = await axiosInstance.post<ApiResponse<LoginResponseDto>>('/auth/login', data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Logout user - calls API
 */
export async function logout(token?: string): Promise<ApiResponse<AuthMessageResponseDto>> {
    try {
        const axios = token ? createAuthorizedAxios(token) : axiosInstance;
        const response = await axios.post<ApiResponse<AuthMessageResponseDto>>('/auth/logout');
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(token?: string): Promise<ApiResponse<RefreshTokenResponseDto>> {
    try {
        const axios = token ? createAuthorizedAxios(token) : axiosInstance;
        const response = await axios.post<ApiResponse<RefreshTokenResponseDto>>('/auth/refresh-token');
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Verify OTP for email confirmation
 */
export async function verifyOtp(data: VerifyOtpDTO): Promise<ApiResponse<MessageResponseDto>> {
    try {
        const response = await axiosInstance.post<ApiResponse<MessageResponseDto>>('/auth/verify-email', data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Resend OTP to user email
 */
export async function resendOtp(data: ResendOtpDTO): Promise<ApiResponse<MessageResponseDto>> {
    try {
        const response = await axiosInstance.post<ApiResponse<MessageResponseDto>>('/auth/resend-verification', data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}
