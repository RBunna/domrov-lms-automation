import { NextRequest, NextResponse } from 'next/server';
import * as authService from './service';
import { RegisterUserDTO, LoginUserDTO, VerifyOtpDTO, ResendOtpDTO } from './dto';

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'signup': {
                const data: RegisterUserDTO = body;
                const result = await authService.signUp(data);
                return NextResponse.json(result);
            }

            case 'login': {
                const data: LoginUserDTO = body;
                const result = await authService.login(data);
                return NextResponse.json(result);
            }

            case 'logout': {
                const result = await authService.logout(token);
                return NextResponse.json(result);
            }

            case 'refresh-token': {
                const result = await authService.refreshToken(token);
                return NextResponse.json(result);
            }

            case 'verify-otp': {
                const data: VerifyOtpDTO = body;
                const result = await authService.verifyOtp(data);
                return NextResponse.json(result);
            }

            case 'resend-otp': {
                const data: ResendOtpDTO = body;
                const result = await authService.resendOtp(data);
                return NextResponse.json(result);
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
