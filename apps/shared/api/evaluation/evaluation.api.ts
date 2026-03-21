// /api/evaluation/evaluation.api.ts

import axiosInstance from '../axios';
import {
  ProcessSubmissionResponseDto,
  FolderStructureResponseDto,
  AddToQueueDto,
  AddToQueueResponseDto,
  ApiResponse
} from './dto';

/**
 * Get the content of a file in a submission
 */
export async function getSubmissionFileContent(
  submissionId: number,
  filePath: string
): Promise<ApiResponse<{ message: string; data: ProcessSubmissionResponseDto }>> {
  try {
    const response = await axiosInstance.get<ApiResponse<{ message: string; data: ProcessSubmissionResponseDto }>>(
      `/evaluations/submission/${submissionId}/file`,
      { params: { file_path: filePath } }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to get file content'
    );
  }
}

/**
 * Get the folder structure of a submission
 */
export async function getSubmissionFolderStructure(
  submissionId: number
): Promise<ApiResponse<{ message: string; data: FolderStructureResponseDto }>> {
  try {
    const response = await axiosInstance.get<ApiResponse<{ message: string; data: FolderStructureResponseDto }>>(
      `/evaluations/submission/${submissionId}/folder-structure`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to get folder structure'
    );
  }
}

/**
 * Add submission to evaluation queue
 */
export async function addToEvaluationQueue(
  data: AddToQueueDto
): Promise<ApiResponse<AddToQueueResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<AddToQueueResponseDto>>(
      `/evaluations/queue`,
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to add to evaluation queue'
    );
  }
}
