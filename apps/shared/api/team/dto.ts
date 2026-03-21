// /api/team/dto.ts

export interface ApiResponse<T> {
  success: true;
  data: T;
}
export interface CreateTeamDto {
  name: string;
  maxMember: number;
  classId: number;
}

export interface CreateTeamItemDto {
  name: string;
  maxMember: number;
  leaderId?: number;
  memberIds?: number[];
}

export interface CreateManyTeamsDto {
  classId: number;
  teams: CreateTeamItemDto[];
}

export interface UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl: string | null;
}

export interface TeamResponseDto {
  id: number;
  name: string;
  joinCode: string;
  maxMember: number;
  leader: UserResponseDto | null;
  members?: UserResponseDto[];
}

export interface JoinTeamDto {
  joinCode: string;
}

export interface InviteTeamByEmailDto {
  email: string;
}

export interface JoinTeamByTokenDto {
  token: string;
}

export interface JoinTeamResponseDto {
  message: string;
  teamId: number;
}

export interface CreateManyTeamsResponseDto {
  message: string;
  teams: TeamResponseDto[];
}

export interface MessageResponseDto {
  message: string;
}
