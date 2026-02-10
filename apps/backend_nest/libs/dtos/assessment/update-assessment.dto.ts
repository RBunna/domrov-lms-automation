import {
    IsString,
    IsDate,
    IsNumber,
    IsBoolean,
    IsOptional,
    ValidateNested,
    IsEnum,
    IsUrl,
    IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateRubricDTO } from './update-rubric.dto';
import { SubmissionMethod } from '../../enums/Assessment';

// Reusable DTO for resources
class UpdateResourceDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUrl()
    url?: string;
}

export class UpdateAssessmentDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    instruction?: string;

    @IsOptional()
    @Transform(({ value }) => (value ? new Date(value) : undefined))
    @IsDate()
    @ApiPropertyOptional()
    dueDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    maxScore?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    allowLate?: boolean;

    // 👈 New fields
    @ApiPropertyOptional({ description: 'Enable AI evaluation', default: false })
    @IsBoolean()
    @IsOptional()
    aiEvaluationEnable?: boolean;

    @ApiPropertyOptional({ enum: SubmissionMethod })
    @IsEnum(SubmissionMethod)
    @IsOptional()
    allowedSubmissionMethod?: SubmissionMethod;

    @ApiPropertyOptional({ type: [UpdateRubricDTO] })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => UpdateRubricDTO)
    rubrics?: UpdateRubricDTO[];

    @ApiPropertyOptional({ type: [UpdateResourceDTO] })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => UpdateResourceDTO)
    resources?: UpdateResourceDTO[];
}   