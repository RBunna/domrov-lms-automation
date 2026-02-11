import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceDTO } from '../file/resource.dto';

export class SubmitAssignmentDto {
  @ApiPropertyOptional({
    type: [ResourceDTO],
    description: 'List of file resources for the submission',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceDTO)
  resources?: ResourceDTO[];

  @ApiPropertyOptional({
    description: 'GitHub repository URL for code submissions',
  })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiPropertyOptional({
    description: 'Optional comments for this submission',
  })
  @IsOptional()
  @IsString()
  comments?: string;
}
