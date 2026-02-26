// /api/evaluation/dto.ts
export interface FileContentDto {
  type: 'file';
  name: string;
  path: string;
  content: string[];
}

export interface ProcessSubmissionResponseDto {
  success: boolean;
  message: string;
  file: FileContentDto;
}

export interface FolderNodeDto {
  name: string;
  type: 'file' | 'folder';
  children?: FolderNodeDto[];
}

export interface FolderStructureResponseDto {
  success: boolean;
  message: string;
  folder_structure: FolderNodeDto;
}

export interface AddQueueResponseDto {
  success: boolean;
  message: string;
}

export interface AIEvaluationResponseDto {
  message: string;
  evaluationId: number;
}
