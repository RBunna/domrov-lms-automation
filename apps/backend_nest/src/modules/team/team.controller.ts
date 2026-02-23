// src/team/team.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
  ParseIntPipe,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamService } from './team.service';
import { CreateTeamDto } from '../../libs/dtos/team/create-team.dto';
import { UserId } from '../../common/decorators/user.decorator';
import { InviteTeamByEmailDto, JoinTeamByTokenDto, JoinTeamDto } from '../../libs/dtos/team/join-team.dto';
import { CreateManyTeamsDto } from '../../libs/dtos/team/create-many-teams.dto';
import { TeamResponseDto } from '../../libs/dtos/team/team-response.dto';
import { JoinTeamResponseDto } from '../../libs/dtos/team/join-team-response.dto';
import { CreateManyTeamsResponseDto } from '../../libs/dtos/team/create-many-teams-response.dto';
import { MessageResponseDto } from '../../libs/dtos/common/message-response.dto';

@ApiTags('Team')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // ==================== TEAM CREATION ====================

  @Post()
  @ApiOperation({
    summary: 'Create a new team',
    description: 'Creates a new team within a class. The creator becomes the team leader.',
  })
  @ApiBody({ type: CreateTeamDto })
  @ApiCreatedResponse({
    description: 'Team created successfully',
    type: TeamResponseDto,
  })
  @ApiForbiddenResponse({ description: 'User is not enrolled in this class' })
  @ApiNotFoundResponse({ description: 'User or class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async createTeam(
    @Body() createTeamDto: CreateTeamDto,
    @UserId() userId: number,
  ): Promise<TeamResponseDto> {
    return this.teamService.createTeam(createTeamDto, userId);
  }

  @Post('many')
  @ApiOperation({
    summary: 'Create multiple teams',
    description: 'Creates multiple teams in a class at once. Only teachers can use this endpoint.',
  })
  @ApiBody({ type: CreateManyTeamsDto })
  @ApiCreatedResponse({
    description: 'Teams created successfully',
    type: CreateManyTeamsResponseDto,
  })
  @ApiForbiddenResponse({ description: 'User is not a teacher of this class' })
  @ApiBadRequestResponse({ description: 'leaderId is required when memberIds are provided' })
  @ApiNotFoundResponse({ description: 'Class or user not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async createManyTeams(
    @Body() createManyTeamsDto: CreateManyTeamsDto,
    @UserId() teacherId: number,
  ): Promise<CreateManyTeamsResponseDto> {
    return this.teamService.createManyTeams(createManyTeamsDto, teacherId);
  }

  // ==================== JOIN TEAM ====================

  @Post('join/code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Join a team using a join code',
    description: 'Students can join a team by entering the 6-character join code. User must be enrolled in the class.',
  })
  @ApiBody({ type: JoinTeamDto })
  @ApiOkResponse({
    description: 'Successfully joined the team',
    type: JoinTeamResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Team not found with this code' })
  @ApiConflictResponse({ description: 'User is already in this team or team is full' })
  @ApiForbiddenResponse({ description: 'User is not enrolled in the class' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async joinTeamWithCode(
    @Body() joinTeamDto: JoinTeamDto,
    @UserId() userId: number,
  ): Promise<JoinTeamResponseDto> {
    return this.teamService.joinTeamWithCode(joinTeamDto.joinCode, userId);
  }

  @Post('join/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Join a team using an invite token',
    description: 'Students can join a team by clicking an invite link with a JWT token.',
  })
  @ApiBody({ type: JoinTeamByTokenDto })
  @ApiOkResponse({
    description: 'Successfully joined the team',
    type: JoinTeamResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid or expired invite link' })
  @ApiConflictResponse({ description: 'User is already in this team' })
  @ApiUnauthorizedResponse({ description: 'You are not invited to this team' })
  @ApiNotFoundResponse({ description: 'Team not found' })
  async joinTeamByToken(
    @Body() dto: JoinTeamByTokenDto,
    @UserId() userId: number,
  ): Promise<JoinTeamResponseDto> {
    return this.teamService.joinTeamWithLink(dto.token, userId);
  }

  // ==================== GET TEAMS ====================

  @Get('class/:classId')
  @ApiOperation({
    summary: 'Get all teams in a class with members',
    description: 'Returns all teams in a class including their leaders and members. User must be a class member.',
  })
  @ApiParam({ name: 'classId', type: Number, example: 1, description: 'The ID of the class' })
  @ApiOkResponse({
    description: 'Teams retrieved successfully',
    type: [TeamResponseDto],
  })
  @ApiForbiddenResponse({ description: 'User is not a member of this class' })
  @ApiNotFoundResponse({ description: 'Class not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getTeamsWithMembers(
    @Param('classId', ParseIntPipe) classId: number,
    @UserId() userId: number,
  ): Promise<TeamResponseDto[]> {
    return this.teamService.getTeamsWithMembersInClass(classId, userId);
  }

  @Get(':teamId')
  @ApiOperation({
    summary: 'Get team details',
    description: 'Returns detailed information about a team including leader and all members.',
  })
  @ApiParam({ name: 'teamId', type: Number, example: 1, description: 'The ID of the team' })
  @ApiOkResponse({
    description: 'Team details retrieved successfully',
    type: TeamResponseDto,
  })
  @ApiForbiddenResponse({ description: 'User is not enrolled in the class' })
  @ApiNotFoundResponse({ description: 'Team not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async getTeamDetails(
    @Param('teamId', ParseIntPipe) teamId: number,
    @UserId() userId: number,
  ): Promise<TeamResponseDto> {
    return this.teamService.getTeamDetails(teamId, userId);
  }

  // ==================== INVITE ====================

  @Post(':teamId/invite')
  @ApiOperation({
    summary: 'Invite a user to a team by email',
    description: 'Sends an email invitation to join the team. Only the team leader can invite. User must be enrolled in the class.',
  })
  @ApiParam({ name: 'teamId', type: Number, example: 1, description: 'The ID of the team' })
  @ApiBody({ type: InviteTeamByEmailDto })
  @ApiOkResponse({
    description: 'Invitation email sent successfully',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Only the team leader can invite members' })
  @ApiNotFoundResponse({ description: 'Team or user not found' })
  @ApiConflictResponse({ description: 'User is already in this team' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async inviteTeamByEmail(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: InviteTeamByEmailDto,
    @UserId() inviterId: number,
  ): Promise<MessageResponseDto> {
    return this.teamService.inviteByEmail(teamId, dto.email, inviterId);
  }

  // ==================== LEAVE / REMOVE ====================

  @Delete(':teamId/leave')
  @ApiOperation({
    summary: 'Leave a team',
    description: 'Allows a team member to leave the team. Leaders cannot leave - they must transfer leadership first.',
  })
  @ApiParam({ name: 'teamId', type: Number, example: 1, description: 'The ID of the team to leave' })
  @ApiOkResponse({
    description: 'Successfully left the team',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Leader cannot leave the team. Transfer leadership first.' })
  @ApiNotFoundResponse({ description: 'You are not in this team' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async leaveTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @UserId() userId: number,
  ): Promise<MessageResponseDto> {
    return this.teamService.leaveTeam(teamId, userId);
  }

  @Delete(':teamId/members/:memberId')
  @ApiOperation({
    summary: 'Remove a member from a team',
    description: 'Removes a member from the team. Only the team leader can remove members.',
  })
  @ApiParam({ name: 'teamId', type: Number, example: 1, description: 'The ID of the team' })
  @ApiParam({ name: 'memberId', type: Number, example: 5, description: 'The ID of the member to remove' })
  @ApiOkResponse({
    description: 'Member removed successfully',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Only the team leader can remove members' })
  @ApiBadRequestResponse({ description: 'The leader cannot be removed' })
  @ApiNotFoundResponse({ description: 'Team or member not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing JWT token' })
  async removeMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @UserId() leaderId: number,
  ): Promise<MessageResponseDto> {
    return this.teamService.removeMember(teamId, memberId, leaderId);
  }
}