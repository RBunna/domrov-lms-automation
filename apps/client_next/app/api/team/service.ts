import { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    CreateTeamDto,
    CreateManyTeamsDto,
    TeamResponseDto,
    JoinTeamDto,
    JoinTeamByTokenDto,
    InviteTeamByEmailDto,
    JoinTeamResponseDto,
    CreateManyTeamsResponseDto,
    MessageResponseDto,
    ApiResponse
} from './dto';

/**
 * Create a new team
 */
export async function createTeam(
    data: CreateTeamDto,
    token?: string
): Promise<ApiResponse<TeamResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<TeamResponseDto>>(`/team`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Create multiple teams at once
 */
export async function createManyTeams(
    data: CreateManyTeamsDto,
    token?: string
): Promise<ApiResponse<CreateManyTeamsResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<CreateManyTeamsResponseDto>>(`/team/many`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Join a team by code
 */
export async function joinTeamByCode(
    data: JoinTeamDto,
    token?: string
): Promise<ApiResponse<JoinTeamResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<JoinTeamResponseDto>>(`/team/join/code`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Join a team by token
 */
export async function joinTeamByToken(
    data: JoinTeamByTokenDto,
    token?: string
): Promise<ApiResponse<JoinTeamResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<JoinTeamResponseDto>>(`/team/join/token`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Get teams by class
 */
export async function getTeamsByClass(
    classId: number,
    token?: string
): Promise<ApiResponse<TeamResponseDto[]>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<TeamResponseDto[]>>(`/team/class/${classId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Get team details
 */
export async function getTeamDetails(
    teamId: number,
    token?: string
): Promise<ApiResponse<TeamResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<TeamResponseDto>>(`/team/${teamId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Invite a member to team by email
 */
export async function inviteTeamByEmail(
    teamId: number,
    data: InviteTeamByEmailDto,
    token?: string
): Promise<ApiResponse<MessageResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<MessageResponseDto>>(`/team/${teamId}/invite`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Leave a team
 */
export async function leaveTeam(
    teamId: number,
    token?: string
): Promise<ApiResponse<MessageResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.delete<ApiResponse<MessageResponseDto>>(`/team/${teamId}/leave`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Remove a member from team
 */
export async function removeMember(
    teamId: number,
    memberId: number,
    token?: string
): Promise<ApiResponse<MessageResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.delete<ApiResponse<MessageResponseDto>>(`/team/${teamId}/members/${memberId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}
