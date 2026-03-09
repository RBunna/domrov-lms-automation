import { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    AssessmentListItemDto,
    AssessmentDetailDto,
    CreateDraftResponseDto,
    PublishAssessmentResponseDto,
    UpdateAssessmentResponseDto,
    DeleteAssessmentResponseDto,
    AssessmentStatsResponseDto,
    CompleteAssessmentResponseDto,
    UpdateAssessmentDto,
    ApiResponse,
    TeamTrackingItemDto,
    IndividualTrackingItemDto
} from './dto';

/**
 * Get assessments for a specific class
 */
export async function getAssessmentsByClass(
    classId: number,
    token?: string
): Promise<ApiResponse<AssessmentListItemDto[]>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<AssessmentListItemDto[]>>(
            `/assessments/class/${classId}`
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
 * Get assessments for a specific class session
 */
export async function getAssessmentsByClassSession(
    classId: number,
    sessionId: number,
    token?: string
): Promise<AssessmentListItemDto[]> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<AssessmentListItemDto[]>(
            `/assessments/class/${classId}/${sessionId}`
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
 * Get detailed information about a specific assessment
 */
export async function getAssessmentDetails(
    assessmentId: number,
    token?: string
): Promise<AssessmentDetailDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<AssessmentDetailDto>(
            `/assessments/${assessmentId}`
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
 * Create a new assessment draft
 */
export async function createAssessmentDraft(
    classId: number,
    session: number,
    token?: string
): Promise<ApiResponse<CreateDraftResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<CreateDraftResponseDto>>(
            `/assessments/class/${classId}/draft`,
            { session }
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
 * Update an assessment draft
 */
export async function updateAssessment(
    assessmentId: number,
    data: UpdateAssessmentDto,
    token?: string
): Promise<ApiResponse<UpdateAssessmentResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.patch<ApiResponse<UpdateAssessmentResponseDto>>(
            `/assessments/${assessmentId}`,
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
 * Publish an assessment
 */
export async function publishAssessment(
    assessmentId: number,
    token?: string
): Promise<ApiResponse<PublishAssessmentResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.patch<ApiResponse<PublishAssessmentResponseDto>>(
            `/assessments/${assessmentId}/publish`
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
 * Delete an assessment
 */
export async function deleteAssessment(
    assessmentId: number,
    token?: string
): Promise<ApiResponse<DeleteAssessmentResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.delete<ApiResponse<DeleteAssessmentResponseDto>>(
            `/assessments/${assessmentId}`
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
 * Complete an assessment
 */
export async function completeAssessment(
    assessmentId: number,
    token?: string
): Promise<CompleteAssessmentResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<CompleteAssessmentResponseDto>(
            `/assessments/${assessmentId}/complete`
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
 * Get assessment tracking information (team or individual)
 */
export async function getAssessmentTracking(
    assessmentId: number,
    token?: string
): Promise<ApiResponse<TeamTrackingItemDto[] | IndividualTrackingItemDto[]>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<TeamTrackingItemDto[] | IndividualTrackingItemDto[]>>(
            `/assessments/${assessmentId}/tracking`
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
 * Get assessment statistics
 */
export async function getAssessmentStats(
    classId: number,
    assessmentId: number,
    token?: string
): Promise<AssessmentStatsResponseDto> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<AssessmentStatsResponseDto>(
            `/assessments/${classId}/stats/${assessmentId}`
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
