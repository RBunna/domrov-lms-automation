import axiosInstance from '../base/axios';
import {
  AssessmentListItemDto,
  AssessmentDetailDto,
  CreateDraftResponseDto,
  PublishAssessmentResponseDto,
} from './dto';

export const getAssessmentsByClass = async (classId: number): Promise<AssessmentListItemDto[]> => {
  try {
    const response = await axiosInstance.get(`/assessments/class/${classId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'Unknown API error');
  }
};

export const getAssessmentsByClassSession = async (
  classId: number,
  sessionId: number
): Promise<AssessmentListItemDto[]> => {
  try {
    const response = await axiosInstance.get(`/assessments/class/${classId}/${sessionId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'Unknown API error');
  }
};

export const getAssessmentDetails = async (id: number): Promise<AssessmentDetailDto> => {
  try {
    const response = await axiosInstance.get(`/assessments/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'Unknown API error');
  }
};

export const createAssessmentDraft = async (
  classId: number,
  session: number
): Promise<CreateDraftResponseDto> => {
  try {
    const response = await axiosInstance.post(`/assessments/class/${classId}/draft`, { session });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'Unknown API error');
  }
};

export const publishAssessment = async (id: number): Promise<PublishAssessmentResponseDto> => {
  try {
    const response = await axiosInstance.patch(`/assessments/${id}/publish`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'Unknown API error');
  }
};