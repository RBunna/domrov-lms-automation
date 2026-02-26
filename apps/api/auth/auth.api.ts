// /api/auth/auth.api.ts
import axios from '../base/axios';
import {
  RegisterUserDTO,
  LoginUserDTO,
  SignUpResponseDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  AuthMessageResponseDto,
  VerifyOtpDTO,
  ResendOtpDTO,
  MessageResponseDto
} from './dto';

export async function signUp(data: RegisterUserDTO): Promise<SignUpResponseDto> {
  try {
    const res = await axios.post<SignUpResponseDto>('/auth/sign-up', data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function login(data: LoginUserDTO): Promise<LoginResponseDto> {
  try {
    const res = await axios.post<LoginResponseDto>('/auth/login', data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function refreshToken(): Promise<RefreshTokenResponseDto> {
  try {
    const res = await axios.post<RefreshTokenResponseDto>('/auth/refresh-token');
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function verifyOtp(data: VerifyOtpDTO): Promise<AuthMessageResponseDto> {
  try {
    const res = await axios.post<AuthMessageResponseDto>('/auth/verify-otp', data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function resendOtp(data: ResendOtpDTO): Promise<MessageResponseDto> {
  try {
    const res = await axios.post<MessageResponseDto>('/auth/resend-otp', data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
