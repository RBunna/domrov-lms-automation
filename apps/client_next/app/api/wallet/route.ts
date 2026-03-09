import { NextRequest, NextResponse } from 'next/server';
import * as walletService from './service';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'balance': {
                const result = await walletService.getWalletBalance(token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'transactions': {
                const page = parseInt(url.searchParams.get('page') || '1');
                const limit = parseInt(url.searchParams.get('limit') || '10');
                const result = await walletService.getTransactionHistory(page, limit, token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'packages': {
                const result = await walletService.getCreditPackages(token);
                return NextResponse.json({ success: true, data: result });
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
