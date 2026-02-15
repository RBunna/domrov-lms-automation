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
    IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateRubricDTO } from './update-rubric.dto';
import { SubmissionMethod, SubmissionType } from '../../enums/Assessment';

// Reusable DTO for resources
class UpdateResourceDTO {
    @ApiPropertyOptional({
        description: 'Existing uploaded resource id',
        example: 12,
    })
    @IsNumber()
    @Type(() => Number)
    resourceId: number;
}

export class UpdateAssessmentDTO {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    instruction?: string;

    @IsOptional()
    @Transform(({ value }) => (value ? new Date(value) : undefined))
    @IsDate()
    @ApiPropertyOptional()
    startDate?: Date;

    @IsOptional()
    @Transform(({ value }) => (value ? new Date(value) : undefined))
    @IsDate()
    @ApiPropertyOptional()
    dueDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) =>
        value !== undefined ? Number(value) : undefined,
    )
    @IsNumber()
    maxScore?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    allowLate?: boolean;

    @ApiPropertyOptional({ enum: SubmissionType })
    @IsEnum(SubmissionType)
    @IsOptional()
    submissionType?: SubmissionType;    

    @ApiPropertyOptional({ default: false })
    @IsBoolean()
    @IsOptional()
    aiEvaluationEnable?: boolean;

    @ApiPropertyOptional({ enum: SubmissionMethod })
    @IsEnum(SubmissionMethod)
    @IsOptional()
    allowedSubmissionMethod?: SubmissionMethod;

    @ApiPropertyOptional({ type: [UpdateRubricDTO] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateRubricDTO)
    rubrics?: UpdateRubricDTO[];

    // ✅ IMPORTANT CHANGE
    @ApiPropertyOptional({ type: [UpdateResourceDTO] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateResourceDTO)
    resources?: UpdateResourceDTO[];
}