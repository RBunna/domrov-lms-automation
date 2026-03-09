import { createAuthorizedAxios } from '@/lib/axiosInstance';
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
    GradeSubmissionDTO,
    ApiResponse
} from './dto';

/**
 * Get my submission status for all assessments in a class (Student)
 */
export async function getMySubmissionStatusInClass(
    classId: number,
    token?: string
): Promise<ApiResponse<SubmissionStatusItemDto[]>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<SubmissionStatusItemDto[]>>(
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
export async function getMySubmissionStatus(
    assessmentId: number,
    token?: string
): Promise<ApiResponse<MySubmissionResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<MySubmissionResponseDto>>(
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
export async function getSubmissionRoster(
    assessmentId: number,
    token?: string
): Promise<ApiResponse<(TeamRosterItemDto | IndividualRosterItemDto)[]>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<(TeamRosterItemDto | IndividualRosterItemDto)[]>>(
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
export async function getSubmissionStats(
    assessmentId: number,
    token?: string
): Promise<ApiResponse<AssessmentStatsResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<AssessmentStatsResponseDto>>(
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
export async function gradeSubmission(
    submissionId: number,
    data: GradeSubmissionDTO,
    token?: string
): Promise<ApiResponse<EvaluationResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<EvaluationResponseDto>>(
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
export async function addFeedback(
    submissionId: number,
    data: FeedbackItemDto,
    token?: string
): Promise<ApiResponse<AddFeedbackResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<AddFeedbackResponseDto>>(
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
export async function updateFeedback(
    feedbackId: string,
    data: FeedbackItemDto,
    token?: string
): Promise<ApiResponse<UpdateFeedbackResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.patch<ApiResponse<UpdateFeedbackResponseDto>>(
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
