import { NextRequest, NextResponse } from 'next/server';
import * as paymentService from './service';
import { CheckTransactionByHashDto } from './dto';

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'start-payment': {
                const { packageId } = body;
                if (!packageId) {
                    return NextResponse.json(
                        { success: false, error: 'packageId is required' },
                        { status: 400 }
                    );
                }
                const result = await paymentService.startPayment(packageId, token);
                return NextResponse.json(result);
            }

            case 'check-transaction': {
                const data: CheckTransactionByHashDto = body;
                const result = await paymentService.checkTransactionByHash(data, token);
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
