import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateRubricDTO {
    @ApiPropertyOptional({ description: 'Rubric ID (omit to create new)' })
    @IsOptional()
    @IsNumber()
    id?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    criterion?: string;

    @ApiPropertyOptional({ example: 40 })
    @IsOptional()
    @IsNumber()
    weight?: number;

}
