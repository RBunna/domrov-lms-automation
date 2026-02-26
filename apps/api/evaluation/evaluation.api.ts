// /api/evaluation/evaluation.api.ts
import axios from '../base/axios';
import {
  ProcessSubmissionResponseDto,
  FolderStructureResponseDto,
  AddQueueResponseDto,
  AIEvaluationResponseDto
} from './dto';

export async function getSubmissionFile(submission_id: number, file_path: string): Promise<ProcessSubmissionResponseDto> {
  try {
    const res = await axios.get<ProcessSubmissionResponseDto>(`/evaluations/submission`, {
      params: { submission_id, file_path }
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function getSubmissionFolder(submission_id: number): Promise<FolderStructureResponseDto> {
  try {
    const res = await axios.get<FolderStructureResponseDto>(`/evaluations/submission-folder`, {
      params: { submission_id }
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function addQueue(data: { submission_id: number; task_type: string }): Promise<AddQueueResponseDto> {
  try {
    const res = await axios.post<AddQueueResponseDto>(`/evaluations/queue`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function aiEvaluate(data: { submission_id: number; model_id: number }): Promise<AIEvaluationResponseDto> {
  try {
    const res = await axios.post<AIEvaluationResponseDto>(`/evaluations/ai-evaluate`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
