import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceDTO } from '../file/resource.dto';

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ type: [ResourceDTO] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceDTO)
  resources?: ResourceDTO[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  githubUrl?: string; // For GIT submissions
}