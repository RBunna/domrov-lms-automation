// /api/class/class.api.ts
import axios from '../base/axios';
import {
  ClassResponseDto,
  CreateClassDto,
  UpdateClassDto,
  JoinClassDto,
  JoinClassByTokenDto,
  JoinClassResponseDto,
  LeaderboardItemDto
} from './dto';

export async function getClass(id: number): Promise<ClassResponseDto> {
  try {
    const res = await axios.get<ClassResponseDto>(`/class/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function createClass(data: CreateClassDto): Promise<ClassResponseDto> {
  try {
    const res = await axios.post<ClassResponseDto>(`/class`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function updateClass(id: number, data: UpdateClassDto): Promise<ClassResponseDto> {
  try {
    const res = await axios.patch<ClassResponseDto>(`/class/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function joinClass(data: JoinClassDto): Promise<JoinClassResponseDto> {
  try {
    const res = await axios.post<JoinClassResponseDto>(`/class/join`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function joinClassByToken(data: JoinClassByTokenDto): Promise<JoinClassResponseDto> {
  try {
    const res = await axios.post<JoinClassResponseDto>(`/class/join-by-token`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function getLeaderboard(classId: number): Promise<LeaderboardItemDto[]> {
  try {
    const res = await axios.get<LeaderboardItemDto[]>(`/class/${classId}/leaderboard`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
