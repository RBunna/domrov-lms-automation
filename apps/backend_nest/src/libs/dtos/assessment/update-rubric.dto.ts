import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateRubricDTO {
    @ApiPropertyOptional({ example: 1, description: 'Rubric ID (omit to create new)' })
    @IsOptional()
    @IsNumber()
    id?: number;

    @ApiPropertyOptional({ example: 'Code Quality', description: 'Criterion name' })
    @IsOptional()
    @IsString()
    criterion?: string;

    @ApiPropertyOptional({ example: 40, description: 'Weight percentage for this criterion' })
    @IsOptional()
    @IsNumber()
    weight?: number;

}
