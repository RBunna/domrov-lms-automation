// /api/evaluation/evaluation.api.ts
import axiosInstance from '../base/axios';
import {
  ProcessSubmissionResponseDto,
  FolderStructureResponseDto,
  AddQueueDto,
} from './dto';

export const getFileContent = async (
  submissionId: number,
  filePath: string
): Promise<ProcessSubmissionResponseDto> => {
  try {
    const response = await axiosInstance.get(
      `/evaluations/submission/${submissionId}/file`,
      { params: { file_path: filePath } }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'Unknown API error');
  }
};

export const getFolderStructure = async (
  submissionId: number
): Promise<FolderStructureResponseDto> => {
  try {
    const response = await axiosInstance.get(
      `/evaluations/submission/${submissionId}/folder-structure`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'Unknown API error');
  }
};

export const addToQueue = async (
  data: AddQueueDto
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axiosInstance.post(`/evaluations/queue`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'Unknown API error');
  }
};
