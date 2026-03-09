import { createAuthorizedAxios } from '@/lib/axiosInstance';
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
    filePath: string,
    token?: string
): Promise<ApiResponse<{ message: string; data: ProcessSubmissionResponseDto }>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<{ message: string; data: ProcessSubmissionResponseDto }>>(
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
    submissionId: number,
    token?: string
): Promise<ApiResponse<{ message: string; data: FolderStructureResponseDto }>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<{ message: string; data: FolderStructureResponseDto }>>(
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
    data: AddToQueueDto,
    token?: string
): Promise<ApiResponse<AddToQueueResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<AddToQueueResponseDto>>(
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
