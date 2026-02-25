import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClassService } from './class.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UserId } from '../../common/decorators/user.decorator';
import {
  JoinClassByTokenDto,
  JoinClassDto,
} from '../../libs/dtos/class/join-class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateClassDto } from '../../libs/dtos/class/create-class.dto';
import { UpdateClassDto } from '../../libs/dtos/class/update-class.dto';
import { TransferOwnershipDto } from '../../libs/dtos/class/transfer-ownership.dto';
import { AssignTADto } from '../../libs/dtos/class/assign-ta.dto';
import { InviteClassByEmailDto } from '../../libs/dtos/class/Invite-class.dto';

import { ClassResponseDto } from '../../libs/dtos/class/class-response.dto';
import { UserResponseDto } from '../../libs/dtos/user/user-response.dto';
import { JoinClassResponseDto } from '../../libs/dtos/class/join-class-response.dto';
import { MessageResponseDto } from '../../libs/dtos/common/message-response.dto';
import { LeaderboardItemDto } from '../../libs/dtos/class/leaderboard-response.dto';
import {
  ClassMemberGuard,
  ClassInstructorGuard,
  ClassOwnerGuard,
  GetClassContext,
} from '../../common/security';
import type { ClassContext } from '../../common/security';

@ApiTags('Class')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  // ==================== CLASS MANAGEMENT ====================

  @Post()
  @ApiOperation({
    summary: 'Create a new class',
    description: 'Creates a new class with the authenticated user as the owner and teacher.',
  })
  @ApiBody({ type: CreateClassDto })
  @ApiCreatedResponse({
    description: 'Class created successfully',
    type: ClassResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async createClass(
    @Body() createClassDto: CreateClassDto,
    @UserId() userId: number,
  ): Promise<ClassResponseDto> {
    return this.classService.createClass(createClassDto, userId);
  }

  @Get('my-classes')
  @ApiOperation({
    summary: 'Get all classes for the current user',
    description: 'Returns all classes where the user is enrolled as student, teacher, or owner.',
  })
  @ApiOkResponse({
    description: 'Classes retrieved successfully',
    type: [ClassResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getMyClasses(@UserId() userId: number): Promise<ClassResponseDto[]> {
    return this.classService.getClassesForUser(userId);
  }

  @Patch(':classId')
  @UseGuards(ClassInstructorGuard)
  @ApiOperation({
    summary: 'Update class info',
    description: 'Updates class name, description, or cover image. Only teachers can update.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class to update' })
  @ApiBody({ type: UpdateClassDto })
  @ApiOkResponse({
    description: 'Class updated successfully',
    type: ClassResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - User is not a teacher of this class' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async updateClass(
    @Param('classId', ParseIntPipe) classId: number,
    @Body() dto: UpdateClassDto,
    @GetClassContext() context: ClassContext,
  ): Promise<ClassResponseDto> {
    return this.classService.updateClass(dto, context);
  }

  @Delete(':classId')
  @UseGuards(ClassOwnerGuard)
  @ApiOperation({
    summary: 'Delete a class',
    description: 'Permanently deletes a class. Only the class owner can delete.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class to delete' })
  @ApiOkResponse({
    description: 'Class deleted successfully',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Only the class owner can delete' })
  @ApiBadRequestResponse({ description: 'Cannot delete due to existing dependencies (assessments, submissions, etc.)' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async deleteClass(
    @Param('classId', ParseIntPipe) classId: number,
    @GetClassContext() context: ClassContext,
  ): Promise<MessageResponseDto> {
    return this.classService.deleteClass(context);
  }

  @Post(':classId/complete')
  @UseGuards(ClassInstructorGuard)
  @ApiOperation({
    summary: 'Mark class as completed',
    description: 'Changes class status to END. Only teachers can mark as complete.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class to mark complete' })
  @ApiOkResponse({
    description: 'Class marked as completed',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - User is not a teacher of this class' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async markComplete(
    @Param('classId', ParseIntPipe) classId: number,
    @GetClassContext() context: ClassContext,
  ): Promise<MessageResponseDto> {
    return this.classService.markClassComplete(context);
  }

  // ==================== JOIN CLASS ====================

  @Post('join/code')
  @ApiOperation({
    summary: 'Join a class using a join code',
    description: 'Students can join a class by entering the 6-character join code.',
  })
  @ApiBody({ type: JoinClassDto })
  @ApiOkResponse({
    description: 'Successfully joined the class',
    type: JoinClassResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Class not found with this code' })
  @ApiConflictResponse({ description: 'User is already enrolled in this class' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async joinClassWithCode(
    @Body() joinClassDto: JoinClassDto,
    @UserId() userId: number,
  ): Promise<JoinClassResponseDto> {
    return this.classService.joinClassWithCode(joinClassDto.joinCode, userId);
  }

  @Get('join/link')
  @ApiOperation({
    summary: 'Join a class using an invite link token',
    description: 'Students can join a class by clicking an invite link with a JWT token.',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT invite token from the invite link',
  })
  @ApiOkResponse({
    description: 'Successfully joined the class',
    type: JoinClassResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid or expired invite link' })
  @ApiConflictResponse({ description: 'User is already enrolled in this class' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - You are not invited to this class' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  async joinByLink(
    @Query() dto: JoinClassByTokenDto,
    @UserId() userId: number,
  ): Promise<JoinClassResponseDto> {
    return this.classService.joinClassByInviteToken(dto.token, userId);
  }

  // ==================== STUDENTS MANAGEMENT ====================

  @Get(':classId/students')
  @UseGuards(ClassMemberGuard)
  @ApiOperation({
    summary: 'Get all students in a class',
    description: 'Returns a list of all enrolled students in the class. Accessible by class members.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class' })
  @ApiOkResponse({
    description: 'Students list retrieved successfully',
    type: [UserResponseDto],
  })
  @ApiForbiddenResponse({ description: 'Forbidden - User is not a member of this class' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getStudentsInClass(
    @Param('classId', ParseIntPipe) classId: number,
    @GetClassContext() context: ClassContext,
  ): Promise<UserResponseDto[]> {
    return this.classService.getStudentsInClass(context);
  }

  @Delete(':classId/student/:studentId')
  @UseGuards(ClassInstructorGuard)
  @ApiOperation({
    summary: 'Remove a student from a class',
    description: 'Removes a student from the class enrollment. Only teachers can remove students.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class' })
  @ApiParam({ name: 'studentId', type: Number, example: 5, description: 'The ID of the student to remove' })
  @ApiOkResponse({
    description: 'Student removed successfully',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Cannot remove another teacher or yourself' })
  @ApiNotFoundResponse({ description: 'Student not found in this class' })
  @ApiBadRequestResponse({ description: 'You cannot remove yourself' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async removeStudent(
    @Param('classId', ParseIntPipe) classId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetClassContext() context: ClassContext,
  ): Promise<MessageResponseDto> {
    return this.classService.removeStudent(studentId, context);
  }

  // ==================== INVITE ====================

  @Post(':classId/invite')
  @UseGuards(ClassInstructorGuard)
  @ApiOperation({
    summary: 'Invite a user by email',
    description: 'Sends an email invitation to join the class. The user must be registered. Only teachers can invite.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class' })
  @ApiBody({ type: InviteClassByEmailDto })
  @ApiOkResponse({
    description: 'Invitation email sent successfully',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - User is not a teacher of this class' })
  @ApiNotFoundResponse({ description: 'User with this email not found. They must register first.' })
  @ApiConflictResponse({ description: 'User is already enrolled in this class' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async inviteByEmail(
    @Param('classId', ParseIntPipe) classId: number,
    @Body() dto: InviteClassByEmailDto,
    @GetClassContext() context: ClassContext,
  ): Promise<MessageResponseDto> {
    return this.classService.inviteByEmail(dto.email, context);
  }

  // ==================== TEACHER MANAGEMENT ====================

  @Post(':classId/transfer-ownership')
  @UseGuards(ClassOwnerGuard)
  @ApiOperation({
    summary: 'Transfer class ownership',
    description: 'Transfers ownership to another enrolled user. The current owner becomes a TA.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class' })
  @ApiBody({ type: TransferOwnershipDto })
  @ApiOkResponse({
    description: 'Ownership transferred successfully',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Only the current owner can transfer ownership' })
  @ApiNotFoundResponse({ description: 'Class not found or new owner not enrolled' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async transferOwnership(
    @Param('classId', ParseIntPipe) classId: number,
    @Body() dto: TransferOwnershipDto,
    @GetClassContext() context: ClassContext,
  ): Promise<MessageResponseDto> {
    return this.classService.transferOwnership(dto.newOwnerId, context);
  }

  @Post(':classId/assign-ta')
  @UseGuards(ClassInstructorGuard)
  @ApiOperation({
    summary: 'Assign a Teaching Assistant',
    description: 'Assigns or promotes a user to Teaching Assistant role. Only teachers can assign TAs.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class' })
  @ApiBody({ type: AssignTADto })
  @ApiOkResponse({
    description: 'TA assigned successfully',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - User is not a teacher of this class' })
  @ApiNotFoundResponse({ description: 'Class or user not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async assignTA(
    @Param('classId', ParseIntPipe) classId: number,
    @Body() dto: AssignTADto,
    @GetClassContext() context: ClassContext,
  ): Promise<MessageResponseDto> {
    return this.classService.assignTA(dto.taId, context);
  }

  // ==================== LEADERBOARD ====================

  @Get(':classId/leaderboard')
  @UseGuards(ClassInstructorGuard)
  @ApiOperation({
    summary: 'Get class leaderboard',
    description: 'Returns students ranked by their total submission scores. Only teachers can view.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class' })
  @ApiOkResponse({
    description: 'Leaderboard retrieved successfully',
    type: [LeaderboardItemDto],
  })
  @ApiForbiddenResponse({ description: 'Forbidden - User is not a teacher of this class' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getLeaderboard(
    @Param('classId', ParseIntPipe) classId: number,
    @GetClassContext() context: ClassContext,
  ): Promise<LeaderboardItemDto[]> {
    return this.classService.getLeaderboard(context);
  }
}