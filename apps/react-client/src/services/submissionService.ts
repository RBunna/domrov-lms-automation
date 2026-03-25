import axiosInstance from '@/lib/axiosInstance';
import type { ApiResponse } from '@/types/api';
import type {
    SubmissionStatusItemDto,
    MySubmissionResponseDto,
    TeamRosterItemDto,
    IndividualRosterItemDto,
    AssessmentStatsResponseDto,
    EvaluationResponseDto,
    AddFeedbackResponseDto,
    UpdateFeedbackResponseDto,
    FeedbackItemDto,
    GradeSubmissionDTO,
    SubmitAssignmentDto,
    SubmitAssignmentResponseDto,
    SubmissionViewerResponseDto,
    ApproveSubmissionResponseDto,
} from '@/types/submission';

/**
 * Get my submission status for all assessments in a class (Student)
 */
export async function getMySubmissionStatusInClass(classId: number): Promise<ApiResponse<SubmissionStatusItemDto[]>> {
    const response = await axiosInstance.get<ApiResponse<SubmissionStatusItemDto[]>>(`/submissions/my-status/class/${classId}`);
    return response.data;
}

/**
 * Get my submission status for a specific assessment (Student)
 */
export async function getMySubmissionStatus(assessmentId: number): Promise<ApiResponse<MySubmissionResponseDto>> {
    const response = await axiosInstance.get<ApiResponse<MySubmissionResponseDto>>(`/submissions/${assessmentId}/my-status`);
    return response.data;
}

/**
 * Get submission roster for an assessment (Teacher)
 */
export async function getSubmissionRoster(assessmentId: number): Promise<ApiResponse<(TeamRosterItemDto | IndividualRosterItemDto)[]>> {
    const response = await axiosInstance.get<ApiResponse<(TeamRosterItemDto | IndividualRosterItemDto)[]>>(`/submissions/assessment/${assessmentId}/roster`);
    return response.data;
}

/**
 * Get submission statistics for an assessment (Teacher)
 */
export async function getSubmissionStats(assessmentId: number): Promise<ApiResponse<AssessmentStatsResponseDto>> {
    const response = await axiosInstance.get<ApiResponse<AssessmentStatsResponseDto>>(`/submissions/assessment/${assessmentId}/stats`);
    return response.data;
}

/**
 * Grade a submission (Teacher)
 */
export async function gradeSubmission(submissionId: number, data: GradeSubmissionDTO): Promise<ApiResponse<EvaluationResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<EvaluationResponseDto>>(`/submissions/${submissionId}/grade`, data);
    return response.data;
}

/**
 * Add line-by-line feedback to a submission (Teacher)
 */
export async function addFeedback(submissionId: number, data: FeedbackItemDto): Promise<ApiResponse<AddFeedbackResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<AddFeedbackResponseDto>>(`/submissions/${submissionId}/feedback`, data);
    return response.data;
}

/**
 * Update a feedback item (Teacher)
 */
export async function updateFeedback(feedbackId: string, data: FeedbackItemDto): Promise<ApiResponse<UpdateFeedbackResponseDto>> {
    const response = await axiosInstance.patch<ApiResponse<UpdateFeedbackResponseDto>>(`/submissions/feedback/${feedbackId}`, data);
    return response.data;
}

/**
 * Get submission details (Teacher)
 */
export async function getSubmissionForTeacher(
    submissionId: number
): Promise<ApiResponse<SubmissionViewerResponseDto>> {
    const response = await axiosInstance.get<ApiResponse<SubmissionViewerResponseDto>>(
        `/submissions/${submissionId}/teacher`
    );
    return response.data;
}

/**
 * Get submission details (Student)
 */
export async function getSubmissionForStudent(
    submissionId: number
): Promise<ApiResponse<SubmissionViewerResponseDto>> {
    const response = await axiosInstance.get<ApiResponse<SubmissionViewerResponseDto>>(
        `/submissions/${submissionId}/student`
    );
    return response.data;
}

/**
 * Approve submission evaluation (Teacher)
 */
export async function approveSubmission(
    submissionId: number
): Promise<ApiResponse<ApproveSubmissionResponseDto>> {
    const response = await axiosInstance.patch<ApiResponse<ApproveSubmissionResponseDto>>(
        `/submissions/approve/${submissionId}`
    );
    return response.data;
}

/**
 * Save or update draft assignment (Student)
 */
export async function saveDraftSubmission(
    assessmentId: number,
    data: SubmitAssignmentDto
): Promise<ApiResponse<SubmitAssignmentResponseDto>> {
    const response = await axiosInstance.patch<ApiResponse<SubmitAssignmentResponseDto>>(
        `/submissions/${assessmentId}/submit`,
        data
    );
    return response.data;
}

/**
 * Submit assignment (final) (Student)
 */
export async function submitAssignment(
    assessmentId: number,
    data: SubmitAssignmentDto
): Promise<ApiResponse<SubmitAssignmentResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<SubmitAssignmentResponseDto>>(
        `/submissions/${assessmentId}/submit`,
        data
    );
    return response.data;
}

/**
 * Unsubmit assignment (Student)
 */
export async function unsubmitAssignment(
    assessmentId: number
): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        `/submissions/${assessmentId}/unsubmit`
    );
    return response.data;
}

const submissionService = {
  getMySubmissionStatusInClass,
  getMySubmissionStatus,
  getSubmissionRoster,
  getSubmissionStats,
  gradeSubmission,
  addFeedback,
  updateFeedback,
  getSubmissionForTeacher,
  getSubmissionForStudent,
  approveSubmission,
  saveDraftSubmission,
  submitAssignment,
  unsubmitAssignment,
};

export default submissionService;
