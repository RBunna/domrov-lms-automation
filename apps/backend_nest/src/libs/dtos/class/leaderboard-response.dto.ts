import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../user/user-response.dto';

export class LeaderboardItemDto {
    @ApiProperty({ type: () => UserResponseDto, description: 'User information' })
    user: UserResponseDto;

    @ApiProperty({ example: 850, description: 'Total score of the user in this class' })
    totalScore: number;
}