// Class DTOs

import { ClassStatus } from '@/lib/enums/ClassStatus';
import { UserRole } from '@/lib/enums/UserRole';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export interface ClassOwnerDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export interface ClassMemberDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    joinedAt: Date;
}

export interface ClassResponseDto {
    id: number;
    name: string;
    description?: string;
    coverImageUrl?: string;
    status: ClassStatus;
    owner: ClassOwnerDto;
    role?: UserRole;
    joinCode?: string;
    createdAt: Date;
}

export interface GetMyClassesResponseDto extends ClassResponseDto {
    memberCount: number;
    assessmentCount: number;
}

export interface CreateClassDto {
    name: string;
    description?: string;
}

export interface UpdateClassDto {
    name?: string;
    description?: string;
    coverImageUrl?: string;
}

export interface JoinClassByCodeDto {
    joinCode: string;
}

export interface JoinClassByTokenDto {
    token: string;
}

export interface JoinClassResponseDto {
    classId: number;
    className: string;
    joinedAt: Date;
}

export interface ClassMembersDto {
    classId: number;
    members: ClassMemberDto[];
    totalMembers: number;
}

export interface InviteMembersDto {
    emails: string[];
}

export interface InviteMembersResponseDto {
    message: string;
    invitedCount: number;
}

export interface RemoveMemberResponseDto {
    message: string;
    memberId: number;
}

export interface TransferOwnershipDto {
    newOwnerId: number;
}

export interface TransferOwnershipResponseDto {
    message: string;
    classId: number;
    newOwnerId: number;
}

export interface AssignTADto {
    userId: number;
}

export interface AssignTAResponseDto {
    message: string;
    userId: number;
}

export interface CompleteClassResponseDto {
    message: string;
    classId: number;
    status: ClassStatus;
}

export interface LeaderboardItemDto {
    rank: number;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    totalScore: number;
}

export interface MessageResponseDto {
    message: string;
}
