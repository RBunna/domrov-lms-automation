// Submission DTOs

import { SubmissionStatus } from '@/lib/enums/SubmissionStatus';
import { ResourceType } from '@/lib/enums/ResourceType';
import { FeedbackType } from '@/lib/enums/FeedbackType';
import { EvaluationType } from '@/lib/enums/SubmissionType';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export interface SubmitResourceDTO {
    resourceId?: number;
}

export interface SubmitAssignmentDto {
    resources?: SubmitResourceDTO[];
    githubUrl?: string;
    comments?: string;
}

export interface GradeSubmissionDTO {
    score: number;
    feedback?: string;
}

export interface FeedbackItemDto {
    path: string;
    startLine?: number;
    endLine?: number;
    message: string;
    type: FeedbackType;
    id?: string;
}

// ==================== RESPONSE DTOs ====================

export interface SubmitAssignmentResponseDto {
    message: string;
    submissionId: number;
}

export interface ApproveSubmissionResponseDto {
    message: string;
    submissionId: number;
    evaluationId: number;
    isApproved: boolean;
}

export interface AddFeedbackResponseDto {
    message: string;
    evaluationId: number;
    addedItemsCount: number;
}

export interface UpdateFeedbackResponseDto {
    message: string;
    feedbackId: string;
}

// ==================== USER/TEAM INFO DTOs ====================

export interface UserBasicInfoDto {
    id: number;
    firstName: string;
    lastName: string;
}

export interface TeamMemberDto {
    id: number;
    user: UserBasicInfoDto | null;
}

export interface TeamInfoDto {
    id: number;
    name: string;
    maxMember: number;
    members: TeamMemberDto[];
}

export interface ClassBasicInfoDto {
    id: number;
    name: string;
}

export interface AssessmentBasicInfoDto {
    id: number;
    title: string;
    maxScore: number;
    class: ClassBasicInfoDto | null;
}

// ==================== RESOURCE DTOs ====================

export interface ResourceBasicInfoDto {
    id: number;
    title: string;
    type: ResourceType;
    url: string | null;
}

export interface SubmissionResourceDto {
    id: number;
    resource: ResourceBasicInfoDto | null;
}

// ==================== EVALUATION DTOs ====================

export interface EvaluationFeedbackItemDto {
    id: string;
    filePath: string;
    startLine: number | null;
    endLine: number | null;
    message: string;
    feedbackType: FeedbackType;
    createdAt: Date;
}

export interface EvaluationResponseDto {
    id: number;
    score: number;
    feedback: string | null;
    penaltyScore: number;
    isApproved: boolean;
    isModified: boolean;
    evaluationType: EvaluationType;
    aiOutput: string | null;
    confidencePoint: string | null;
    feedbacks: EvaluationFeedbackItemDto[];
    created_at: Date;
    updated_at: Date;
}

export interface EvaluationSummaryDto {
    id: number;
    score: number;
    feedback: string | null;
    aiFeedback: string | null;
    isApproved: boolean;
}

// ==================== SUBMISSION STATUS DTOs ====================

export interface SubmissionStatusItemDto {
    assessmentId: number;
    assessmentTitle: string;
    status: SubmissionStatus;
    submissionId?: number;
    submittedAt?: Date;
    score?: number;
}

export interface MySubmissionResponseDto {
    submissionId?: number;
    status: SubmissionStatus;
    submittedAt?: Date;
    score?: number;
    evaluation?: EvaluationSummaryDto;
}

// ==================== ROSTER DTOs ====================

export interface TeamRosterItemDto {
    teamId: number;
    teamName: string;
    status: SubmissionStatus;
    submissionId?: number;
    submittedAt?: Date;
    score?: number;
}

export interface IndividualRosterItemDto {
    userId: number;
    firstName: string;
    lastName: string;
    status: SubmissionStatus;
    submissionId?: number;
    submittedAt?: Date;
    score?: number;
}

export interface AssessmentStatsResponseDto {
    totalSubmissions: number;
    pendingSubmissions: number;
    gradedSubmissions: number;
    lateSubmissions: number;
    averageScore: number;
}

// ==================== SUBMISSION VIEWER RESPONSE ====================

export interface SubmissionViewerResponseDto {
    id: number;
    created_at: Date;
    updated_at: Date;
    submissionTime: Date;
    status: SubmissionStatus;
    attemptNumber: number;
    user: UserBasicInfoDto | null;
    team: TeamInfoDto | null;
    assessment: AssessmentBasicInfoDto | null;
    evaluation: EvaluationResponseDto | null;
    resources?: SubmissionResourceDto[];
    githubUrl?: string;
    comments?: string;
}
