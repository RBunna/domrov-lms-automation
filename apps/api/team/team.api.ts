// /api/team/team.api.ts
import axios from '../base/axios';
import {
  CreateTeamDto,
  CreateManyTeamsDto,
  TeamResponseDto,
  JoinTeamDto,
  JoinTeamByTokenDto,
  InviteTeamByEmailDto,
  JoinTeamResponseDto,
  CreateManyTeamsResponseDto,
  MessageResponseDto
} from './dto';

export async function createTeam(data: CreateTeamDto): Promise<TeamResponseDto> {
  try {
    const res = await axios.post<TeamResponseDto>(`/team`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function createManyTeams(data: CreateManyTeamsDto): Promise<CreateManyTeamsResponseDto> {
  try {
    const res = await axios.post<CreateManyTeamsResponseDto>(`/team/many`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function joinTeamWithCode(data: JoinTeamDto): Promise<JoinTeamResponseDto> {
  try {
    const res = await axios.post<JoinTeamResponseDto>(`/team/join/code`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function joinTeamByToken(data: JoinTeamByTokenDto): Promise<JoinTeamResponseDto> {
  try {
    const res = await axios.post<JoinTeamResponseDto>(`/team/join/token`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function getTeamsWithMembers(classId: number): Promise<TeamResponseDto[]> {
  try {
    const res = await axios.get<TeamResponseDto[]>(`/team/class/${classId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function getTeamDetails(teamId: number): Promise<TeamResponseDto> {
  try {
    const res = await axios.get<TeamResponseDto>(`/team/${teamId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function inviteTeamByEmail(teamId: number, data: InviteTeamByEmailDto): Promise<MessageResponseDto> {
  try {
    const res = await axios.post<MessageResponseDto>(`/team/${teamId}/invite`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function leaveTeam(teamId: number): Promise<MessageResponseDto> {
  try {
    const res = await axios.delete<MessageResponseDto>(`/team/${teamId}/leave`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function removeMember(teamId: number, memberId: number): Promise<MessageResponseDto> {
  try {
    const res = await axios.delete<MessageResponseDto>(`/team/${teamId}/members/${memberId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
