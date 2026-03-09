import { NextRequest, NextResponse } from 'next/server';
import * as teamService from './service';
import {
    CreateTeamDto,
    CreateManyTeamsDto,
    JoinTeamDto,
    JoinTeamByTokenDto,
    InviteTeamByEmailDto
} from './dto';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const classId = url.searchParams.get('classId');
        const teamId = url.searchParams.get('teamId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'by-class': {
                if (!classId) {
                    return NextResponse.json(
                        { success: false, error: 'classId is required' },
                        { status: 400 }
                    );
                }
                const result = await teamService.getTeamsByClass(parseInt(classId), token);
                return NextResponse.json(result);
            }

            case 'details': {
                if (!teamId) {
                    return NextResponse.json(
                        { success: false, error: 'teamId is required' },
                        { status: 400 }
                    );
                }
                const result = await teamService.getTeamDetails(parseInt(teamId), token);
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
            case 'create': {
                const data: CreateTeamDto = body;
                const result = await teamService.createTeam(data, token);
                return NextResponse.json(result);
            }

            case 'create-many': {
                const data: CreateManyTeamsDto = body;
                const result = await teamService.createManyTeams(data, token);
                return NextResponse.json(result);
            }

            case 'join-by-code': {
                const data: JoinTeamDto = body;
                const result = await teamService.joinTeamByCode(data, token);
                return NextResponse.json(result);
            }

            case 'join-by-token': {
                const data: JoinTeamByTokenDto = body;
                const result = await teamService.joinTeamByToken(data, token);
                return NextResponse.json(result);
            }

            case 'invite': {
                const { teamId, ...data } = body;
                if (!teamId) {
                    return NextResponse.json(
                        { success: false, error: 'teamId is required' },
                        { status: 400 }
                    );
                }
                const result = await teamService.inviteTeamByEmail(
                    teamId,
                    data as InviteTeamByEmailDto,
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
        const action = url.searchParams.get('action');
        const teamId = url.searchParams.get('teamId');
        const memberId = url.searchParams.get('memberId');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!teamId) {
            return NextResponse.json(
                { success: false, error: 'teamId is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'leave': {
                const result = await teamService.leaveTeam(parseInt(teamId), token);
                return NextResponse.json(result);
            }

            case 'remove-member': {
                if (!memberId) {
                    return NextResponse.json(
                        { success: false, error: 'memberId is required' },
                        { status: 400 }
                    );
                }
                const result = await teamService.removeMember(
                    parseInt(teamId),
                    parseInt(memberId),
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
