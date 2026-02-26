// /api/submission/submission.api.ts
import axios from '../base/axios';
import {
  SubmitAssignmentDto,
  SubmitAssignmentResponseDto,
  ApproveSubmissionResponseDto,
  GradeSubmissionDTO,
  FeedbackItemDto,
  AddFeedbackResponseDto,
  UpdateFeedbackResponseDto,
  EvaluationResponseDto
} from './dto';

export async function approveSubmission(id: number): Promise<ApproveSubmissionResponseDto> {
  try {
    const res = await axios.patch<ApproveSubmissionResponseDto>(`/submissions/approve/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function submitAssignment(data: SubmitAssignmentDto): Promise<SubmitAssignmentResponseDto> {
  try {
    const res = await axios.post<SubmitAssignmentResponseDto>(`/submissions/submit`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function gradeSubmission(id: number, data: GradeSubmissionDTO): Promise<EvaluationResponseDto> {
  try {
    const res = await axios.patch<EvaluationResponseDto>(`/submissions/grade/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function addFeedback(id: number, items: FeedbackItemDto[]): Promise<AddFeedbackResponseDto> {
  try {
    const res = await axios.post<AddFeedbackResponseDto>(`/submissions/${id}/feedback`, items);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

export async function updateFeedback(id: string, data: FeedbackItemDto): Promise<UpdateFeedbackResponseDto> {
  try {
    const res = await axios.patch<UpdateFeedbackResponseDto>(`/submissions/feedback/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
