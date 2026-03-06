// /api/submission/submission.api.ts  
import axiosInstance from '../axios';
import {
  SubmissionStatusItemDto,
  MySubmissionResponseDto,
  TeamRosterItemDto,
  IndividualRosterItemDto,
  AssessmentStatsResponseDto,
  EvaluationResponseDto,
  AddFeedbackResponseDto,
  UpdateFeedbackResponseDto,
  FeedbackItemDto,
  GradeSubmissionDTO
} from './dto';
import { ApiResponse } from '../assessment/dto';

/**
 * Get my submission status for all assessments in a class (Student)
 */
export async function getMySubmissionStatusInClass(classId: number): Promise<ApiResponse<SubmissionStatusItemDto[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<SubmissionStatusItemDto[]>>(
      `/submissions/class/${classId}/my-status`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

/**
 * Get my submission status for a specific assessment (Student)
 */
export async function getMySubmissionStatus(assessmentId: number): Promise<ApiResponse<MySubmissionResponseDto>> {
  try {
    const response = await axiosInstance.get<ApiResponse<MySubmissionResponseDto>>(
      `/submissions/${assessmentId}/my-status`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

/**
 * Get submission roster for an assessment (Teacher)
 */
export async function getSubmissionRoster(assessmentId: number): Promise<ApiResponse<(TeamRosterItemDto | IndividualRosterItemDto)[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<(TeamRosterItemDto | IndividualRosterItemDto)[]>>(
      `/submissions/assessment/${assessmentId}/roster`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

/**
 * Get submission statistics for an assessment (Teacher)
 */
export async function getSubmissionStats(assessmentId: number): Promise<ApiResponse<AssessmentStatsResponseDto>> {
  try {
    const response = await axiosInstance.get<ApiResponse<AssessmentStatsResponseDto>>(
      `/submissions/assessment/${assessmentId}/stats`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

/**
 * Grade a submission (Teacher)
 */
export async function gradeSubmission(submissionId: number, data: GradeSubmissionDTO): Promise<ApiResponse<EvaluationResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<EvaluationResponseDto>>(
      `/submissions/${submissionId}/grade`,
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

/**
 * Add line-by-line feedback to a submission (Teacher)
 */
export async function addFeedback(submissionId: number, data: FeedbackItemDto): Promise<ApiResponse<AddFeedbackResponseDto>> {
  try {
    const response = await axiosInstance.post<ApiResponse<AddFeedbackResponseDto>>(
      `/submissions/${submissionId}/feedback`,
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}

/**
 * Update a feedback item (Teacher)
 */
export async function updateFeedback(feedbackId: string, data: FeedbackItemDto): Promise<ApiResponse<UpdateFeedbackResponseDto>> {
  try {
    const response = await axiosInstance.patch<ApiResponse<UpdateFeedbackResponseDto>>(
      `/submissions/feedback/${feedbackId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Unknown API error'
    );
  }
}
