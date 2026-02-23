import { ApiProperty } from '@nestjs/swagger';

export class JoinClassResponseDto {
    @ApiProperty({ example: 'Successfully joined the class', description: 'Response message' })
    message: string;

    @ApiProperty({ example: 1, description: 'The ID of the class that was joined' })
    classId: number;
}
