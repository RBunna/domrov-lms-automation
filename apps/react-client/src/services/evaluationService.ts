import axiosInstance from '@/lib/axiosInstance';
import type { ApiResponse } from '@/types/api';
import type {
    ProcessSubmissionResponseDto,
    FolderStructureResponseDto,
    AddToQueueDto,
    AddToQueueResponseDto,
} from '@/types/evaluation';
import type {
  AIProviderDto,
  CreateUserAIKeyDto,
  UserAIKeyResponseDto,
  UpdateUserAIKeyDto,
} from "@/types/ai";

/**
 * Get the content of a file in a submission
 */
export async function getSubmissionFileContent(
    submissionId: number,
    filePath: string
): Promise<ApiResponse<{ message: string; data: ProcessSubmissionResponseDto }>> {
    const response = await axiosInstance.get<ApiResponse<{ message: string; data: ProcessSubmissionResponseDto }>>(
        `/evaluations/submission/${submissionId}/file`,
        { params: { file_path: filePath } }
    );
    return response.data;
}

/**
 * Get the folder structure of a submission
 */
export async function getSubmissionFolderStructure(
    submissionId: number
): Promise<ApiResponse<{ message: string; data: FolderStructureResponseDto }>> {
    const response = await axiosInstance.get<ApiResponse<{ message: string; data: FolderStructureResponseDto }>>(
        `/evaluations/submission/${submissionId}/folder-structure`
    );
    return response.data;
}

/**
 * Add submission to evaluation queue
 */
export async function addToEvaluationQueue(data: AddToQueueDto): Promise<ApiResponse<AddToQueueResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<AddToQueueResponseDto>>('/evaluations/queue', data);
    return response.data;
}

/**
 * Save AI configuration
 */
export async function saveAIConfig(config: {
  provider: string;
  model: string;
  apiKey: string;
  apiEndpoint: string;
}): Promise<ApiResponse<{ message: string }>> {
  const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
    '/evaluations/ai-config',
    config
  );
  return response.data;
}

/**
 * Fetch all AI providers
 */
export async function fetchAIProviders(): Promise<ApiResponse<AIProviderDto[]>> {
  const response = await axiosInstance.get<ApiResponse<AIProviderDto[]>>('/user-ai/providers');
  return response.data;
}

/**
 * Create a new AI key
 * apiEndpoint added — required for gemini, ollama, openrouter, grok, custom
 */
export async function createAIKey(
  data: CreateUserAIKeyDto & { apiEndpoint?: string }
): Promise<ApiResponse<UserAIKeyResponseDto>> {
  const response = await axiosInstance.post<ApiResponse<UserAIKeyResponseDto>>('/user-ai', data);
  return response.data;
}

/**
 * Fetch all AI keys for the authenticated user
 */
export async function fetchAIKeys(): Promise<ApiResponse<UserAIKeyResponseDto[]>> {
  const response = await axiosInstance.get<ApiResponse<UserAIKeyResponseDto[]>>('/user-ai');
  return response.data;
}

/**
 * Fetch a single AI key by ID
 */
export async function fetchAIKeyById(id: number): Promise<ApiResponse<UserAIKeyResponseDto>> {
  const response = await axiosInstance.get<ApiResponse<UserAIKeyResponseDto>>(`/user-ai/${id}`);
  return response.data;
}

/**
 * Update an existing AI key
 * ✅ apiEndpoint added — can be updated for non-managed providers
 */
export async function updateAIKey(
  id: number,
  data: UpdateUserAIKeyDto & { apiEndpoint?: string }
): Promise<ApiResponse<UserAIKeyResponseDto>> {
  const response = await axiosInstance.patch<ApiResponse<UserAIKeyResponseDto>>(`/user-ai/${id}`, data);
  return response.data;
}

/**
 * Delete an AI key
 */
export async function deleteAIKey(id: number): Promise<ApiResponse<{ message: string }>> {
  const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(`/user-ai/${id}`);
  return response.data;
}

const evaluationService = {
    getSubmissionFileContent,
    getSubmissionFolderStructure,
    addToEvaluationQueue,
    saveAIConfig,
    fetchAIProviders,
    createAIKey,
    fetchAIKeys,
    fetchAIKeyById,
    updateAIKey,
    deleteAIKey,
};

export default evaluationService;