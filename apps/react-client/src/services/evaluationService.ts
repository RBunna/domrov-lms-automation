import axiosInstance from '@/lib/axiosInstance';
import type { ApiResponse } from '@/types/api';
import type {
    ProcessSubmissionResponseDto,
    FolderStructureResponseDto,
    AddToQueueDto,
    AddToQueueResponseDto,
} from '@/types/evaluation';

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

const evaluationService = {
    getSubmissionFileContent,
    getSubmissionFolderStructure,
    addToEvaluationQueue,
};

export default evaluationService;
