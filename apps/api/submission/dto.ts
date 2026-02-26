// /api/submission/dto.ts
export enum SubmissionStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  RESUBMITTED = 'RESUBMITTED',
  LATE = 'LATE',
}

export enum ResourceType {
  FILE = 'FILE',
  URL = 'URL',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  TEXT = 'TEXT',
  OTHER = 'OTHER',
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

export type FeedbackType = 'SUGGESTION' | 'ERROR' | 'INFO'; // If backend has more, add them

export interface FeedbackItemDto {
  path: string;
  startLine?: number;
  endLine?: number;
  message: string;
  type: FeedbackType;
  id?: string;
}

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
  evaluationType: 'AI' | 'MANUAL';
  aiOutput: string | null;
}
