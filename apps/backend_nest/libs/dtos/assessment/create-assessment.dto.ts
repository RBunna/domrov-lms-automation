import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionType } from '../../enums/Assessment';
import { CreateRubricDTO } from './create-rubric.dto';

export class CreateAssessmentDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  instruction: string;

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

  @ApiProperty()
  @IsNumber()
  maxScore: number;

  @ApiProperty({ enum: SubmissionType })
  @IsEnum(SubmissionType)
  submissionType: SubmissionType;

  @ApiProperty()
  @IsBoolean()
  allowLate: boolean;

  @ApiProperty()
  @IsBoolean()
  allowTeamSubmition: boolean;

  @ApiProperty()
  @IsNumber()
  classId: number;

  @ApiProperty({ type: [CreateRubricDTO] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRubricDTO)
  rubrics: CreateRubricDTO[];
}
