import { NextRequest, NextResponse } from 'next/server';
import * as submissionService from './service';
import { GradeSubmissionDTO, FeedbackItemDto } from './dto';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const classId = url.searchParams.get('classId');
        const assessmentId = url.searchParams.get('assessmentId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'my-status-in-class': {
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await submissionService.getMySubmissionStatusInClass(
                    parseInt(classId),
                    token
                );
                return NextResponse.json(result);
            }

            case 'my-status': {
                if (!assessmentId) {
                    return NextResponse.json(
                        { success: false, error: 'assessmentId is required' },
                        { status: 400 }
                    );
                }
                const result = await submissionService.getMySubmissionStatus(
                    parseInt(assessmentId),
                    token
                );
                return NextResponse.json(result);
            }

            case 'roster': {
                if (!assessmentId) {
                    return NextResponse.json(
                        { success: false, error: 'assessmentId is required' },
                        { status: 400 }
                    );
                }
                const result = await submissionService.getSubmissionRoster(
                    parseInt(assessmentId),
                    token
                );
                return NextResponse.json(result);
            }

            case 'stats': {
                if (!assessmentId) {
                    return NextResponse.json(
                        { success: false, error: 'assessmentId is required' },
                        { status: 400 }
                    );
                }
                const result = await submissionService.getSubmissionStats(
                    parseInt(assessmentId),
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
            case 'grade': {
                const { submissionId, ...data } = body;
                if (!submissionId) {
                    return NextResponse.json(
                        { success: false, error: 'submissionId is required' },
                        { status: 400 }
                    );
                }
                const result = await submissionService.gradeSubmission(
                    submissionId,
                    data as GradeSubmissionDTO,
                    token
                );
                return NextResponse.json(result);
            }

            case 'add-feedback': {
                const { submissionId, ...data } = body;
                if (!submissionId) {
                    return NextResponse.json(
                        { success: false, error: 'submissionId is required' },
                        { status: 400 }
                    );
                }
                const result = await submissionService.addFeedback(
                    submissionId,
                    data as FeedbackItemDto,
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

export async function PATCH(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const feedbackId = url.searchParams.get('feedbackId');
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!feedbackId) {
            return NextResponse.json(
                { success: false, error: 'feedbackId is required' },
                { status: 400 }
            );
        }

        const result = await submissionService.updateFeedback(
            feedbackId,
            body as FeedbackItemDto,
            token
        );
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
