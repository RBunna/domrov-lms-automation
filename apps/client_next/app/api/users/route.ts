import { NextRequest, NextResponse } from 'next/server';
import * as userService from './service';
import { UpdateProfileDto, ChangePasswordDto, SearchUsersQuery } from './dto';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'me': {
                const result = await userService.getMyProfile(token);
                return NextResponse.json(result);
            }

            case 'search': {
                const query: SearchUsersQuery = {
                    id: url.searchParams.get('id') ? parseInt(url.searchParams.get('id')!) : undefined,
                    email: url.searchParams.get('email') || undefined,
                    firstName: url.searchParams.get('firstName') || undefined,
                    lastName: url.searchParams.get('lastName') || undefined,
                    phoneNumber: url.searchParams.get('phoneNumber') || undefined,
                };
                const result = await userService.searchUsers(query, token);
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

export async function PATCH(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        const data: UpdateProfileDto = await request.json();
        const result = await userService.updateMyProfile(data, token);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'change-password': {
                const data: ChangePasswordDto = body;
                const result = await userService.changePassword(data, token);
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
