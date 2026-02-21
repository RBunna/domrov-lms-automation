import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserAIKeyDto } from '../../libs/dtos/user/create-user-ai-key.dto';
import { UpdateUserAIKeyDto } from '../../libs/dtos/user/update-user-ai-key.dto';
import { UserAIKey } from '../../libs/entities/ai/user-ai-key.entity';
import { UserId } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserAiService } from './user-ai.service';


@ApiTags('User AI Keys')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('user-ai')
export class UserAiController {
  constructor(private readonly userAIService: UserAiService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user AI key' })
  @ApiResponse({
    status: 201,
    description: 'The AI key has been successfully stored.',
    type: UserAIKey,
  })
  async create(
    @Body() createUserAIKeyDto: CreateUserAIKeyDto,
    @UserId() userId: number,
  ) {
    return this.userAIService.create(userId, createUserAIKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all AI keys of the user' })
  @ApiResponse({
    status: 200,
    description: 'List of user AI keys',
    type: [UserAIKey],
  })
  async findAll(@UserId() userId: number) {
    return this.userAIService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single AI key by ID' })
  @ApiResponse({ status: 200, description: 'User AI key', type: UserAIKey })
  @ApiResponse({ status: 404, description: 'User AI key not found' })
  async findOne(@Param('id') id: number, @UserId() userId: number) {
    return this.userAIService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an existing AI key' })
  @ApiResponse({ status: 200, description: 'The AI key has been updated', type: UserAIKey })
  @ApiResponse({ status: 404, description: 'User AI key not found' })
  async update(
    @Param('id') id: number,
    @Body() updateUserAIKeyDto: UpdateUserAIKeyDto,
    @UserId() userId: number,
  ) {
    return this.userAIService.update(userId, id, updateUserAIKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an AI key' })
  @ApiResponse({ status: 200, description: 'The AI key has been deleted' })
  @ApiResponse({ status: 404, description: 'User AI key not found' })
  async remove(@Param('id') id: number, @UserId() userId: number) {
    return this.userAIService.remove(userId, id);
  }
}