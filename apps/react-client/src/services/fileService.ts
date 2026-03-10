import axiosInstance from '@/lib/axiosInstance';
import type {
    ApiResponse,
    PresignedUrlRequestDto,
    PresignedUrlResponseDto,
    NotifyUploadDto,
    NotifyUploadResponseDto,
} from '@/types';

/**
 * Get presigned URL for file upload
 */
export async function getPresignedUrl(data: PresignedUrlRequestDto): Promise<ApiResponse<PresignedUrlResponseDto>> {
    const response = await axiosInstance.get<ApiResponse<PresignedUrlResponseDto>>('/file/presigned-url', {
        params: data
    });
    return response.data;
}

/**
 * Notify backend that file has been uploaded
 */
export async function notifyUpload(data: NotifyUploadDto): Promise<ApiResponse<NotifyUploadResponseDto>> {
    const response = await axiosInstance.post<ApiResponse<NotifyUploadResponseDto>>('/file/notify-upload', data);
    return response.data;
}

/**
 * Download file by resource ID
 */
export async function downloadFile(resourceId: number): Promise<Blob> {
    const response = await axiosInstance.get<Blob>(`/file/download/${resourceId}`, {
        responseType: 'blob'
    });
    return response.data;
}

/**
 * Upload file to presigned URL
 */
export async function uploadToPresignedUrl(presignedUrl: string, file: File): Promise<void> {
    await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
        },
    });
}

const fileService = {
    getPresignedUrl,
    notifyUpload,
    downloadFile,
    uploadToPresignedUrl,
};

export default fileService;
