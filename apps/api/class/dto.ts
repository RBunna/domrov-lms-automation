// /api/class/dto.ts
export enum ClassStatus {
  BEING_START = 'BEING_START',
  ACTIVE = 'ACTIVE',
  END = 'END',
}

export enum UserRole {
  Teacher = 'Teacher',
  Student = 'Student',
  TeacherAssistant = 'TeacherAssistant',
  ClassMonitor = 'ClassMonitor',
  AcademicStaff = 'AcademicStaff',
}

export interface ClassOwnerDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
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

export interface JoinClassDto {
  joinCode: string;
}

export interface JoinClassByTokenDto {
  token: string;
}

export interface JoinClassResponseDto {
  message: string;
  classId: number;
}

export interface LeaderboardItemDto {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  totalScore: number;
}
