import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateUserAIKeyDto } from '../../libs/dtos/user/create-user-ai-key.dto';
import { UpdateUserAIKeyDto } from '../../libs/dtos/user/update-user-ai-key.dto';
import { UserAIKey } from '../../libs/entities/ai/user-ai-key.entity';
import { AIUsageLog } from '../../libs/entities/ai/ai-usage-log.entity';
import { UserId } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserAiService } from './user-ai.service';
import { AIUsageLogService } from './ai-usage-log.service';

@ApiTags('User AI Keys & Usage Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('user-ai')
export class UserAiController {
  constructor(
    private readonly userAIService: UserAiService,
    private readonly aiLogService: AIUsageLogService,
  ) { }

  // --------------------- AI Key CRUD ---------------------
  @Post()
  @ApiOperation({ summary: 'Create a new AI key for the authenticated user' })
  @ApiBody({ type: CreateUserAIKeyDto, description: 'AI key creation payload' })
  @ApiResponse({ status: 201, description: 'The AI key has been successfully stored.', type: UserAIKey })
  async create(
    @Body() createUserAIKeyDto: CreateUserAIKeyDto,
    @UserId() userId: number,
  ) {
    return this.userAIService.create(userId, createUserAIKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all AI keys of the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user AI keys', type: [UserAIKey] })
  async findAll(@UserId() userId: number) {
    return this.userAIService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single AI key by ID' })
  @ApiParam({ name: 'id', description: 'AI key ID', example: 1 })
  @ApiResponse({ status: 200, description: 'User AI key', type: UserAIKey })
  @ApiResponse({ status: 404, description: 'User AI key not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.userAIService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an existing AI key' })
  @ApiParam({ name: 'id', description: 'AI key ID', example: 1 })
  @ApiBody({ type: UpdateUserAIKeyDto, description: 'Fields to update for the AI key' })
  @ApiResponse({ status: 200, description: 'The AI key has been updated', type: UserAIKey })
  @ApiResponse({ status: 404, description: 'User AI key not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserAIKeyDto: UpdateUserAIKeyDto,
    @UserId() userId: number,
  ) {
    return this.userAIService.update(userId, id, updateUserAIKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an AI key' })
  @ApiParam({ name: 'id', description: 'AI key ID', example: 1 })
  @ApiResponse({ status: 200, description: 'The AI key has been deleted' })
  @ApiResponse({ status: 404, description: 'User AI key not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.userAIService.remove(userId, id);
  }

  // --------------------- Usage Logs ---------------------
  @Get('user/logs')
  @ApiOperation({ summary: 'Get AI usage logs for the authenticated user' })
  @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Maximum number of logs to return' })
  @ApiQuery({ name: 'offset', required: false, example: 0, description: 'Number of logs to skip for pagination' })
  @ApiResponse({ status: 200, description: 'List of AI usage logs', type: [AIUsageLog] })
  async getUserLogs(
    @UserId() userId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.aiLogService.getUserLogs(userId, limit ? +limit : 50, offset ? +offset : 0);
  }

  @Get('model/:keyId')
  @ApiOperation({ summary: 'Get AI usage logs filtered by model of a given AI key' })
  @ApiParam({ name: 'keyId', description: 'User AI Key ID to fetch model', example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Maximum number of logs to return' })
  @ApiQuery({ name: 'offset', required: false, example: 0, description: 'Number of logs to skip for pagination' })
  @ApiResponse({ status: 200, description: 'List of AI usage logs filtered by model', type: [AIUsageLog] })
  async getLogsByModel(
    @Param('keyId', ParseIntPipe) keyId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.aiLogService.getLogsByModel(keyId, limit ? +limit : 50, offset ? +offset : 0);
  }
}