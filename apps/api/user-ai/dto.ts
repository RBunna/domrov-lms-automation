// /api/user-ai/dto.ts

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface CreateUserAIKeyDto {
  provider: string;
  model?: string;
  apiKey: string;
  apiEndpoint?: string;
  label?: string;
}

export interface UpdateUserAIKeyDto {
  model?: string;
  apiKey?: string;
  apiEndpoint?: string;
  label?: string;
  isActive?: boolean;
  isValid?: boolean;
}

export interface UserAIKeyResponseDto {
  id: number;
  userId: number;
  provider: string;
  model?: string;
  isActive: boolean;
  isValid: boolean;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIUsageLogResponseDto {
  id: number;
  title: string;
  usingDate: Date;
  inputTokenCount: number;
  outputTokenCount: number;
  userId: number;
  userAiKeyId?: number;
  createdAt: Date;
  updatedAt: Date;
}
