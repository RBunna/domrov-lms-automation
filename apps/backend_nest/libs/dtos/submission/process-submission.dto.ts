import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetFilesSubmissionDto {
    @ApiProperty({ description: 'Submission ID', example: 'e063a2da37924151' })
    @IsString()
    submission_id: string;

    @ApiProperty({ description: 'File path of the submission', example: 'main.bat' })
    @IsString()
    file_path: string;
}
