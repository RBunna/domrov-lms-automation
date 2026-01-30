import {
    IsString,
    IsDate,
    IsNumber,
    IsBoolean,
    IsOptional,
    ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateRubricDTO } from './update-rubric.dto';

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

    @ApiPropertyOptional({ type: [UpdateRubricDTO] })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => UpdateRubricDTO)
    rubrics?: UpdateRubricDTO[];
}
