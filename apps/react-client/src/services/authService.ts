import axiosInstance from '@/lib/axiosInstance';
import type { ApiResponse, MessageResponse } from '@/types/api';
import type {
    RegisterUserDTO,
    LoginUserDTO,
    VerifyOtpDTO,
    ResendOtpDTO,
    SignUpResponseDto,
    LoginResponseDto,
    RefreshTokenResponseDto,
    AuthMessageResponseDto,
} from '@/types/auth';

/**
 * Register a new user account
 */
export async function signUp(data: RegisterUserDTO): Promise<ApiResponse<SignUpResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<SignUpResponseDto>>('/auth/sign-up', data);
    return response.data;
}

/**
 * Login user with email and password
 */
export async function login(data: LoginUserDTO): Promise<ApiResponse<LoginResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<LoginResponseDto>>('/auth/login', data);
    return response.data;
}

/**
 * Logout user - clears token from storage and calls API
 */
export async function logout(): Promise<ApiResponse<AuthMessageResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<AuthMessageResponseDto>>('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return response.data;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(): Promise<ApiResponse<RefreshTokenResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<RefreshTokenResponseDto>>('/auth/refresh-token');
    return response.data;
}

/**
 * Verify OTP for email confirmation
 */
export async function verifyOtp(data: VerifyOtpDTO): Promise<ApiResponse<MessageResponse>> {
    const response = await axiosInstance.post<ApiResponse<MessageResponse>>('/auth/verify-email', data);
    return response.data;
}

/**
 * Resend OTP to user email
 */
export async function resendOtp(data: ResendOtpDTO): Promise<ApiResponse<MessageResponse>> {
    const response = await axiosInstance.post<ApiResponse<MessageResponse>>('/auth/resend-verification', data);
    return response.data;
}

const authService = {
    signUp,
    login,
    logout,
    refreshToken,
    verifyOtp,
    resendOtp,
};

export default authService;
