// /api/team/team.api.ts
import axiosInstance from '../axios';
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

export async function createTeam(data: CreateTeamDto): Promise<ApiResponse<TeamResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<TeamResponseDto>>(`/team`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function createManyTeams(data: CreateManyTeamsDto): Promise<ApiResponse<CreateManyTeamsResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<CreateManyTeamsResponseDto>>(`/team/many`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function joinTeamByCode(data: JoinTeamDto): Promise<ApiResponse<JoinTeamResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<JoinTeamResponseDto>>(`/team/join/code`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function joinTeamByToken(data: JoinTeamByTokenDto): Promise<ApiResponse<JoinTeamResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<JoinTeamResponseDto>>(`/team/join/token`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function getTeamsByClass(classId: number): Promise<ApiResponse<TeamResponseDto[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<TeamResponseDto[]>>(`/team/class/${classId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function getTeamDetails(teamId: number): Promise<ApiResponse<TeamResponseDto>> {
  try {
    const response = await axiosInstance.get<ApiResponse<TeamResponseDto>>(`/team/${teamId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function inviteTeamByEmail(teamId: number, data: InviteTeamByEmailDto): Promise<ApiResponse<MessageResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<MessageResponseDto>>(`/team/${teamId}/invite`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function leaveTeam(teamId: number): Promise<ApiResponse<MessageResponseDto>> {
  try {
    const response = await axiosInstance.delete<ApiResponse<MessageResponseDto>>(`/team/${teamId}/leave`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function removeMember(teamId: number, memberId: number): Promise<ApiResponse<MessageResponseDto>> {
  try {
    const response = await axiosInstance.delete<ApiResponse<MessageResponseDto>>(`/team/${teamId}/members/${memberId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
