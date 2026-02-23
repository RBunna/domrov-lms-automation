import { IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetFilesSubmissionDto {
    @ApiProperty({ description: 'Submission ID', example: 1 })
    @Type(() => Number)       
    @IsInt()
    submission_id: number;

    @ApiProperty({
        description: 'File path of the submission',
        example: 'main.bat',
    })
    @IsString()
    file_path: string;
}
export class GetSubmissionFolderDto {
    @ApiProperty({ example: 1, description: 'ID of the submission to get folder contents' })
    @Type(() => Number)
    @IsInt()
    submission_id: number;
}