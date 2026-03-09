// File DTOs

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export type ResourceTypeParam = 'module' | 'topic' | 'assessment' | 'class' | 'submission';

export interface PresignedUrlRequestDto {
    filename: string;
    contentType: string;
    resourceType: ResourceTypeParam;
    resourceId: number;
}

export interface PresignedUrlResponseDto {
    presignedUrl: string;
    key: string;
}

export interface NotifyUploadDto {
    key: string;
    filename: string;
}

export interface NotifyUploadResponseDto {
    message: string;
}
