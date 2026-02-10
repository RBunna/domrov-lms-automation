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
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionMethod, SubmissionType } from '../../enums/Assessment';
import { CreateRubricDTO } from './create-rubric.dto';
import { IsAfterStartDate } from '../../../src/common/decorators/IsAfterStartDate';
import { ResourceDTO } from '../file/resource.dto';
export class CreateAssessmentDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  instruction: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ format: 'date-time' })
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Validate(IsAfterStartDate)
  @ApiPropertyOptional({ format: 'date-time' })
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

  @ApiProperty({ description: 'Enable AI evaluation', default: false })
  @IsBoolean()
  @IsOptional()
  aiEvaluationEnable?: boolean;

  @ApiProperty({ enum: SubmissionMethod })
  @IsEnum(SubmissionMethod)
  allowedSubmissionMethod: SubmissionMethod; 

  @ApiProperty({ type: [CreateRubricDTO] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRubricDTO)
  rubrics: CreateRubricDTO[];


  @ApiPropertyOptional({ type: [ResourceDTO] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ResourceDTO)
  resources?: ResourceDTO[];
}