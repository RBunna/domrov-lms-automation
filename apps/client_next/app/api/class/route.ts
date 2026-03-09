import { NextRequest, NextResponse } from 'next/server';
import * as classService from './service';
import {
    CreateClassDto,
    UpdateClassDto,
    JoinClassByCodeDto,
    JoinClassByTokenDto,
    InviteMembersDto,
    TransferOwnershipDto,
    AssignTADto
} from './dto';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const classId = url.searchParams.get('classId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'my-classes': {
                const result = await classService.getMyClasses(token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'get': {
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await classService.getClass(parseInt(classId), token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'members': {
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await classService.getClassMembers(parseInt(classId), token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'leaderboard': {
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await classService.getLeaderboard(parseInt(classId), token);
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
            case 'create': {
                const data: CreateClassDto = body;
                const result = await classService.createClass(data, token);
                return NextResponse.json(result);
            }

            case 'join-by-code': {
                const data: JoinClassByCodeDto = body;
                const result = await classService.joinClassByCode(data, token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'join-by-token': {
                const data: JoinClassByTokenDto = body;
                const result = await classService.joinClassByToken(data, token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'invite-members': {
                const { classId, ...data } = body;
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await classService.inviteMembers(classId, data as InviteMembersDto, token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'transfer-ownership': {
                const { classId, ...data } = body;
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await classService.transferOwnership(classId, data as TransferOwnershipDto, token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'assign-ta': {
                const { classId, ...data } = body;
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await classService.assignTA(classId, data as AssignTADto, token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'complete': {
                const { classId } = body;
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await classService.completeClass(classId, token);
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
        const classId = url.searchParams.get('classId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!classId) {
            return NextResponse.json(
                { success: false, error: 'classId is required' },
                { status: 400 }
            );
        }

        const data: UpdateClassDto = await request.json();
        const result = await classService.updateClass(parseInt(classId), data, token);
        return NextResponse.json({ success: true, data: result });
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
        const action = url.searchParams.get('action');
        const classId = url.searchParams.get('classId');
        const userId = url.searchParams.get('userId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!classId) {
            return NextResponse.json(
                { success: false, error: 'classId is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'delete': {
                const result = await classService.deleteClass(parseInt(classId), token);
                return NextResponse.json({ success: true, data: result });
            }

            case 'remove-member': {
                if (!userId) {
                    return NextResponse.json(
                        { success: false, error: 'userId is required' },
                        { status: 400 }
                    );
                }
                const result = await classService.removeMember(
                    parseInt(classId),
                    parseInt(userId),
                    token
                );
                return NextResponse.json({ success: true, data: result });
            }

            default:
                // Default behavior: delete class
                const result = await classService.deleteClass(parseInt(classId), token);
                return NextResponse.json({ success: true, data: result });
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
