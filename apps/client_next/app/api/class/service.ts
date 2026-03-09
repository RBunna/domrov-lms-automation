import { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    ClassResponseDto,
    CreateClassDto,
    UpdateClassDto,
    JoinClassByCodeDto,
    JoinClassByTokenDto,
    JoinClassResponseDto,
    LeaderboardItemDto,
    ClassMembersDto,
    InviteMembersDto,
    TransferOwnershipDto,
    AssignTADto,
    CompleteClassResponseDto,
    GetMyClassesResponseDto,
    ApiResponse,
    MessageResponseDto
} from './dto';

/**
 * Create a new class
 */
export async function createClass(
    data: CreateClassDto,
    token?: string
): Promise<ApiResponse<ClassResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<ClassResponseDto>>(`/class`, data);
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
 * Get all classes for current user
 */
export async function getMyClasses(token?: string): Promise<GetMyClassesResponseDto[]> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<ApiResponse<GetMyClassesResponseDto[]>>>(`/class/my-classes`);
        // Backend returns nested structure: { success, data: { success, data: [...] } }
        const nestedData = response.data.data;
        // Handle both nested and flat responses
        if (nestedData && typeof nestedData === 'object' && 'data' in nestedData && Array.isArray((nestedData as any).data)) {
            return (nestedData as any).data;
        }
        return Array.isArray(nestedData) ? nestedData : [];
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}

/**
 * Get a specific class by ID
 */
export async function getClass(classId: number, token?: string): Promise<ClassResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ClassResponseDto>(`/class/${classId}`);
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
 * Update class information
 */
export async function updateClass(
    classId: number,
    data: UpdateClassDto,
    token?: string
): Promise<ClassResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.patch<ClassResponseDto>(`/class/${classId}`, data);
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
 * Delete a class
 */
export async function deleteClass(classId: number, token?: string): Promise<MessageResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.delete<MessageResponseDto>(`/class/${classId}`);
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
 * Join a class using join code
 */
export async function joinClassByCode(
    data: JoinClassByCodeDto,
    token?: string
): Promise<JoinClassResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<JoinClassResponseDto>(`/class/join/code`, data);
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
 * Join a class using join token
 */
export async function joinClassByToken(
    data: JoinClassByTokenDto,
    token?: string
): Promise<JoinClassResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<JoinClassResponseDto>(`/class/join/token`, data);
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
 * Get class members
 */
export async function getClassMembers(
    classId: number,
    token?: string
): Promise<ClassMembersDto[]> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ClassMembersDto[]>(`/class/${classId}/members`);
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
 * Invite members to class
 */
export async function inviteMembers(
    classId: number,
    data: InviteMembersDto,
    token?: string
): Promise<MessageResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<MessageResponseDto>(
            `/class/${classId}/members`,
            data
        );
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
 * Remove member from class
 */
export async function removeMember(
    classId: number,
    userId: number,
    token?: string
): Promise<MessageResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.delete<MessageResponseDto>(
            `/class/${classId}/members/${userId}`
        );
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
 * Transfer class ownership
 */
export async function transferOwnership(
    classId: number,
    data: TransferOwnershipDto,
    token?: string
): Promise<MessageResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<MessageResponseDto>(
            `/class/${classId}/transfer-ownership`,
            data
        );
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
 * Assign TA to class
 */
export async function assignTA(
    classId: number,
    data: AssignTADto,
    token?: string
): Promise<MessageResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<MessageResponseDto>(
            `/class/${classId}/assign-ta`,
            data
        );
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
 * Complete/End a class
 */
export async function completeClass(
    classId: number,
    token?: string
): Promise<CompleteClassResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<CompleteClassResponseDto>(
            `/class/${classId}/complete`
        );
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
 * Get class leaderboard
 */
export async function getLeaderboard(
    classId: number,
    token?: string
): Promise<LeaderboardItemDto[]> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<LeaderboardItemDto[]>(
            `/class/${classId}/leaderboard`
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            'Unknown API error'
        );
    }
}
