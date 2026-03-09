import { NextRequest, NextResponse } from 'next/server';
import * as assessmentService from './service';
import { UpdateAssessmentDto } from './dto';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const classId = url.searchParams.get('classId');
        const sessionId = url.searchParams.get('sessionId');
        const assessmentId = url.searchParams.get('assessmentId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'by-class': {
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await assessmentService.getAssessmentsByClass(
                    parseInt(classId),
                    token
                );
                return NextResponse.json(result);
            }

            case 'by-class-session': {
                if (!classId || !sessionId) {
                    return NextResponse.json(
                        { success: false, error: 'classId and sessionId are required' },
                        { status: 400 }
                    );
                }
                const result = await assessmentService.getAssessmentsByClassSession(
                    parseInt(classId),
                    parseInt(sessionId),
                    token
                );
                return NextResponse.json({ success: true, data: result });
            }

            case 'details': {
                if (!assessmentId) {
                    return NextResponse.json(
                        { success: false, error: 'assessmentId is required' },
                        { status: 400 }
                    );
                }
                const result = await assessmentService.getAssessmentDetails(
                    parseInt(assessmentId),
                    token
                );
                return NextResponse.json({ success: true, data: result });
            }

            case 'tracking': {
                if (!assessmentId) {
                    return NextResponse.json(
                        { success: false, error: 'assessmentId is required' },
                        { status: 400 }
                    );
                }
                const result = await assessmentService.getAssessmentTracking(
                    parseInt(assessmentId),
                    token
                );
                return NextResponse.json(result);
            }

            case 'stats': {
                if (!classId || !assessmentId) {
                    return NextResponse.json(
                        { success: false, error: 'classId and assessmentId are required' },
                        { status: 400 }
                    );
                }
                const result = await assessmentService.getAssessmentStats(
                    parseInt(classId),
                    parseInt(assessmentId),
                    token
                );
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

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'create-draft': {
                const { classId, session } = body;
                if (!classId || session === undefined) {
                    return NextResponse.json(
                        { success: false, error: 'classId and session are required' },
                        { status: 400 }
                    );
                }
                const result = await assessmentService.createAssessmentDraft(
                    classId,
                    session,
                    token
                );
                return NextResponse.json(result);
            }

            case 'complete': {
                const { assessmentId } = body;
                if (!assessmentId) {
                    return NextResponse.json(
                        { success: false, error: 'assessmentId is required' },
                        { status: 400 }
                    );
                }
                const result = await assessmentService.completeAssessment(
                    assessmentId,
                    token
                );
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

export async function PATCH(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const assessmentId = url.searchParams.get('assessmentId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!assessmentId) {
            return NextResponse.json(
                { success: false, error: 'assessmentId is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'update': {
                const data: UpdateAssessmentDto = await request.json();
                const result = await assessmentService.updateAssessment(
                    parseInt(assessmentId),
                    data,
                    token
                );
                return NextResponse.json(result);
            }

            case 'publish': {
                const result = await assessmentService.publishAssessment(
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

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const assessmentId = url.searchParams.get('assessmentId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!assessmentId) {
            return NextResponse.json(
                { success: false, error: 'assessmentId is required' },
                { status: 400 }
            );
        }

        const result = await assessmentService.deleteAssessment(
            parseInt(assessmentId),
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
