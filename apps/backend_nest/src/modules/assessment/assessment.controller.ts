import {
  Body, Controller, Post, Get, Param, UseGuards, ParseIntPipe,
  Delete,
  Patch
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../../common/decorators/user.decorator';
import { UpdateAssessmentDTO } from '../../libs/dtos/assessment/update-assessment.dto';

@ApiTags('Assessments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) { }

  @Get('class/:classId')
  @ApiOperation({ summary: 'List all assignments for a class' })
  async getAllByClass(@Param('classId', ParseIntPipe) classId: number) {
    return this.assessmentService.findAllByClass(classId);
  }

  @Get('class/:classId/:sessionId')
  @ApiOperation({ summary: 'List all assignments for a class session' })
  async getAllByClassSession(
    @Param('classId', ParseIntPipe) classId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number
  ) {
    return this.assessmentService.findAllByClassSession(classId, sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of one assignment (Instructions, Attachments)' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.assessmentService.findOne(id);
  }

  @Post('class/:classId/draft')
  @ApiOperation({ summary: 'Create Assessment Draft (Instructor)' })
  async createDraft(
    @Param('classId', ParseIntPipe) classId: number,
    @Body('session', ParseIntPipe) session: number, // session usually comes from body or param based on your logic
    @UserId() instructorId: number,
  ) {
    return this.assessmentService.createDraft(instructorId, classId, session);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish Assessment' })
  async publishAssessment(
    @Param('id', ParseIntPipe) id: number,
    @UserId() instructorId: number,
  ) {
    return this.assessmentService.publishAssessment(id, instructorId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Teacher: Update assignment details' })
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssessmentDTO,
  ) {
    return this.assessmentService.updateAssessment(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Teacher: Delete assignment' })
  async remove(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.assessmentService.deleteAssessment(userId, id);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get Class Roster Status (Instructor)' })
  async getTracking(@Param('id', ParseIntPipe) assessmentId: number) {
    return this.assessmentService.getTracking(assessmentId);
  }
}