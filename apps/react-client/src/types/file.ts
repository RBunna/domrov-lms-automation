// File API DTOs
export interface PresignedUrlRequestDto {
    filename: string;
    contentType: string;
    resourceType: 'module' | 'topic' | 'assessment' | 'class' | 'submission';
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
