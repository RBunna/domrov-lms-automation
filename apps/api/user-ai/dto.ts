// /api/user-ai/dto.ts
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
