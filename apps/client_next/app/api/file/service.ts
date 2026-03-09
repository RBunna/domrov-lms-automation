import { createAuthorizedAxios } from '@/lib/axiosInstance';
import {
    PresignedUrlRequestDto,
    PresignedUrlResponseDto,
    NotifyUploadDto,
    NotifyUploadResponseDto,
    ApiResponse
} from './dto';

/**
 * Get presigned URL for file upload
 */
export async function getPresignedUrl(
    data: PresignedUrlRequestDto,
    token?: string
): Promise<ApiResponse<PresignedUrlResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<ApiResponse<PresignedUrlResponseDto>>(`/file/presigned-url`, {
            params: data
        });
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
 * Notify backend that file has been uploaded
 */
export async function notifyUpload(
    data: NotifyUploadDto,
    token?: string
): Promise<ApiResponse<NotifyUploadResponseDto>> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.post<ApiResponse<NotifyUploadResponseDto>>(`/file/notify-upload`, data);
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
 * Download file by resource ID
 */
export async function downloadFile(
    resourceId: number,
    token?: string
): Promise<Blob> {
    try {
        const axios = createAuthorizedAxios(token);
        const response = await axios.get<Blob>(
            `/file/download/${resourceId}`,
            { responseType: 'blob' }
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
