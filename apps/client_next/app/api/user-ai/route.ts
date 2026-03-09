import { NextRequest, NextResponse } from 'next/server';
import * as userAIService from './service';
import { CreateUserAIKeyDto, UpdateUserAIKeyDto } from './dto';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const keyId = url.searchParams.get('keyId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'all': {
                const result = await userAIService.getAllUserAIKeys(token);
                return NextResponse.json(result);
            }

            case 'get': {
                if (!keyId) {
                    return NextResponse.json(
                        { success: false, error: 'keyId is required' },
                        { status: 400 }
                    );
                }
                const result = await userAIService.getUserAIKey(parseInt(keyId), token);
                return NextResponse.json(result);
            }

            case 'logs': {
                const limit = url.searchParams.get('limit');
                const offset = url.searchParams.get('offset');
                const result = await userAIService.getUserAIUsageLogs(
                    limit ? parseInt(limit) : undefined,
                    offset ? parseInt(offset) : undefined,
                    token
                );
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        const data: CreateUserAIKeyDto = body;
        const result = await userAIService.createUserAIKey(data, token);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const keyId = url.searchParams.get('keyId');
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!keyId) {
            return NextResponse.json(
                { success: false, error: 'keyId is required' },
                { status: 400 }
            );
        }

        const data: UpdateUserAIKeyDto = body;
        const result = await userAIService.updateUserAIKey(parseInt(keyId), data, token);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const keyId = url.searchParams.get('keyId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!keyId) {
            return NextResponse.json(
                { success: false, error: 'keyId is required' },
                { status: 400 }
            );
        }

        const result = await userAIService.deleteUserAIKey(parseInt(keyId), token);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
