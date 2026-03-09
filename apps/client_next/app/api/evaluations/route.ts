import { NextRequest, NextResponse } from 'next/server';
import * as evaluationService from './service';
import { AddToQueueDto } from './dto';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const submissionId = url.searchParams.get('submissionId');
        const filePath = url.searchParams.get('filePath');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!submissionId) {
            return NextResponse.json(
                { success: false, error: 'submissionId is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'file-content': {
                if (!filePath) {
                    return NextResponse.json(
                        { success: false, error: 'filePath is required' },
                        { status: 400 }
                    );
                }
                const result = await evaluationService.getSubmissionFileContent(
                    parseInt(submissionId),
                    filePath,
                    token
                );
                return NextResponse.json(result);
            }

            case 'folder-structure': {
                const result = await evaluationService.getSubmissionFolderStructure(
                    parseInt(submissionId),
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
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'add-to-queue': {
                const data: AddToQueueDto = body;
                const result = await evaluationService.addToEvaluationQueue(data, token);
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
