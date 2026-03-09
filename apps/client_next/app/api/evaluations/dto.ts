// Evaluation DTOs

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export interface FileContentDto {
    type: 'file';
    name: string;
    path: string;
    content: string[];
}

export interface ProcessSubmissionResponseDto {
    file: FileContentDto;
}

export interface FolderNodeDto {
    name: string;
    type: 'file' | 'folder';
    children?: FolderNodeDto[];
}

export interface FolderStructureResponseDto {
    folder_structure: FolderNodeDto;
}

export interface AddToQueueDto {
    submission_id: string;
}

export interface AddToQueueResponseDto {
    message: string;
}
