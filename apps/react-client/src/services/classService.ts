import axiosInstance from '@/lib/axiosInstance';
import type { ApiResponse, MessageResponse } from '@/types/api';
import type {
    ClassResponseDto,
    GetMyClassesResponseDto,
    CreateClassDto,
    UpdateClassDto,
    JoinClassByCodeDto,
    JoinClassByTokenDto,
    JoinClassResponseDto,
    ClassMembersDto,
    InviteMembersDto,
    TransferOwnershipDto,
    LeaderboardItemDto,
} from '@/types/class';

/**
 * Create a new class
 */
export async function createClass(data: CreateClassDto): Promise<ApiResponse<ClassResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<ClassResponseDto>>('/class', data);
    return response.data;
}

/**
 * Get all classes for current user
 */
export async function getMyClasses(): Promise<GetMyClassesResponseDto[]> {
    const response = await axiosInstance.get<ApiResponse<GetMyClassesResponseDto[]>>('/class/my-classes');
    return response.data.data;
}

/**
 * Get a specific class by ID
 */
export async function getClass(classId: number): Promise<ClassResponseDto> {
    const response = await axiosInstance.get<ApiResponse<ClassResponseDto>>(`/class/${classId}`);
    return response.data.data;
}

/**
 * Update class information
 */
export async function updateClass(classId: number, data: UpdateClassDto): Promise<ClassResponseDto> {
    const response = await axiosInstance.patch<ApiResponse<ClassResponseDto>>(`/class/${classId}`, data);
    return response.data.data;
}

/**
 * Delete a class
 */
export async function deleteClass(classId: number): Promise<MessageResponse> {
    const response = await axiosInstance.delete<MessageResponse>(`/class/${classId}`);
    return response.data;
}

/**
 * Join a class using join code
 */
export async function joinClassByCode(data: JoinClassByCodeDto): Promise<JoinClassResponseDto> {
    const response = await axiosInstance.post<ApiResponse<JoinClassResponseDto>>('/class/join/code', data);
    return response.data.data;
}

/**
 * Join a class using join token
 */
export async function joinClassByToken(data: JoinClassByTokenDto): Promise<JoinClassResponseDto> {
    const response = await axiosInstance.post<ApiResponse<JoinClassResponseDto>>('/class/join/token', data);
    return response.data.data;
}

/**
 * Get class members
 */
export async function getClassMembers(classId: number): Promise<ClassMembersDto[]> {
    const response = await axiosInstance.get<ApiResponse<ClassMembersDto[]>>(`/class/${classId}/members`);
    return response.data.data;
}

/**
 * Invite members to class
 */
export async function inviteMembers(classId: number, data: InviteMembersDto): Promise<MessageResponse> {
    const response = await axiosInstance.post<MessageResponse>(`/class/${classId}/members`, data);
    return response.data;
}

/**
 * Remove member from class
 */
export async function removeMember(classId: number, userId: number): Promise<MessageResponse> {
    const response = await axiosInstance.delete<MessageResponse>(`/class/${classId}/members/${userId}`);
    return response.data;
}

/**
 * Transfer class ownership
 */
export async function transferOwnership(classId: number, data: TransferOwnershipDto): Promise<MessageResponse> {
    const response = await axiosInstance.post<MessageResponse>(`/class/${classId}/transfer-ownership`, data);
    return response.data;
}

/**
 * Get class leaderboard
 */
export async function getLeaderboard(classId: number): Promise<LeaderboardItemDto[]> {
    const response = await axiosInstance.get<ApiResponse<LeaderboardItemDto[]>>(`/class/${classId}/leaderboard`);
    return response.data.data;
}

const classService = {
    createClass,
    getMyClasses,
    getClass,
    updateClass,
    deleteClass,
    joinClassByCode,
    joinClassByToken,
    getClassMembers,
    inviteMembers,
    removeMember,
    transferOwnership,
    getLeaderboard,
};

export default classService;
