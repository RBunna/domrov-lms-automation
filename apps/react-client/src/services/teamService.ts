import axiosInstance from '@/lib/axiosInstance';
import type { ApiResponse, MessageResponse } from '@/types/api';
import type {
    TeamResponseDto,
    CreateTeamDto,
    CreateManyTeamsDto,
    CreateManyTeamsResponseDto,
    JoinTeamDto,
    JoinTeamByTokenDto,
    JoinTeamResponseDto,
    InviteTeamByEmailDto,
} from '@/types/team';

/**
 * Create a new team
 */
export async function createTeam(data: CreateTeamDto): Promise<ApiResponse<TeamResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<TeamResponseDto>>('/team', data);
    return response.data;
}

/**
 * Create multiple teams at once
 */
export async function createManyTeams(data: CreateManyTeamsDto): Promise<ApiResponse<CreateManyTeamsResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<CreateManyTeamsResponseDto>>('/team/many', data);
    return response.data;
}

/**
 * Join team by join code
 */
export async function joinTeamByCode(data: JoinTeamDto): Promise<ApiResponse<JoinTeamResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<JoinTeamResponseDto>>('/team/join/code', data);
    return response.data;
}

/**
 * Join team by token
 */
export async function joinTeamByToken(data: JoinTeamByTokenDto): Promise<ApiResponse<JoinTeamResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<JoinTeamResponseDto>>('/team/join/token', data);
    return response.data;
}

/**
 * Get teams by class ID
 */
export async function getTeamsByClass(classId: number): Promise<ApiResponse<TeamResponseDto[]>> {
    const response = await axiosInstance.get<ApiResponse<TeamResponseDto[]>>(`/team/class/${classId}`);
    return response.data;
}

/**
 * Get team details
 */
export async function getTeamDetails(teamId: number): Promise<ApiResponse<TeamResponseDto>> {
    const response = await axiosInstance.get<ApiResponse<TeamResponseDto>>(`/team/${teamId}`);
    return response.data;
}

/**
 * Invite team member by email
 */
export async function inviteTeamByEmail(teamId: number, data: InviteTeamByEmailDto): Promise<ApiResponse<MessageResponse>> {
    const response = await axiosInstance.post<ApiResponse<MessageResponse>>(`/team/${teamId}/invite`, data);
    return response.data;
}

/**
 * Leave a team
 */
export async function leaveTeam(teamId: number): Promise<ApiResponse<MessageResponse>> {
    const response = await axiosInstance.post<ApiResponse<MessageResponse>>(`/team/${teamId}/leave`);
    return response.data;
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: number): Promise<ApiResponse<MessageResponse>> {
    const response = await axiosInstance.delete<ApiResponse<MessageResponse>>(`/team/${teamId}`);
    return response.data;
}

const teamService = {
    createTeam,
    createManyTeams,
    joinTeamByCode,
    joinTeamByToken,
    getTeamsByClass,
    getTeamDetails,
    inviteTeamByEmail,
    leaveTeam,
    deleteTeam,
};

export default teamService;
