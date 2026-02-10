import {
  Body, Controller, Post, Get, Param, UseGuards, ParseIntPipe,
  Delete,
  Patch
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDTO } from '../../../libs/dtos/assessment/create-assessment.dto';
import { GradeSubmissionDTO } from '../../../libs/dtos/submission/grade-submission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../../common/decorators/user.decorator';
import { UpdateAssessmentDTO } from '../../../libs/dtos/assessment/update-assessment.dto';
import { EvaluationDto } from '../../../libs/dtos/assessment/ai-evaluation.dto';
import { SubmitAssignmentDto } from '../../../libs/dtos/submission/submit-assignment.dto';
import { FeedbackItemDto } from '../../../libs/dtos/submission/feedback-item.dto';

@ApiTags('Assessments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) { }

  // ==========================================
  // 1. Instructor Actions (Manage Assessments)
  // ==========================================

  // Specific static routes first
  @Get('class/:classId')
  @ApiOperation({
    summary: 'List all assignments for a class',
  })
  async getAllByClass(@Param('classId', ParseIntPipe) classId: number) {
    return this.assessmentService.findAllByClass(classId);
  }

  @Post('class/:classId')
  @ApiOperation({ summary: 'Create Assessment (Instructor)' })
  async createAssessment(
    @Param('classId', ParseIntPipe) classId: number,
    @Body() createAssessmentDto: CreateAssessmentDTO,
    @UserId() instructorId: number,
  ) {
    return this.assessmentService.createAssessment(instructorId, classId, createAssessmentDto);
  }

  // Parameterized routes later
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get details of one assignment (Instructions, Attachments)',
  })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.assessmentService.findOne(id);
  }

  // ==========================================
  // 2. Student Actions (Submissions)
  // ==========================================

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit Assignment (Student/Team)' })
  async submit(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) assessmentId: number,
    @Body() submitAssignmentDto: SubmitAssignmentDto,
  ) {
    return this.assessmentService.submitAssignment(userId, assessmentId, submitAssignmentDto);
  }

  @Get(':id/my-status')
  @ApiOperation({
    summary: 'Student: Check my status (Handles Team Sync automatically)',
  })
  async getMyStatus(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) assessmentId: number,
  ) {
    return this.assessmentService.getMySubmission(userId, assessmentId);
  }

  // ==========================================
  // 3. Evaluation & Tracking
  // ==========================================

  // --- Instructor Views ---

  @Get(':id/submissions')
  @ApiOperation({ summary: 'Teacher: List all submissions for an assessment' })
  async listSubmissions(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) assessmentId: number,
  ) {
    return this.assessmentService.listSubmissionsForInstructor(
      userId,
      assessmentId,
    );
  }

  @Get(':id/students-status')
  @ApiOperation({
    summary: 'Teacher: Get list of all students/teams with SUBMIT/NOT_SUBMIT status',
  })
  async getStudentStatusList(@Param('id', ParseIntPipe) assessmentId: number) {
    return this.assessmentService.getAssignmentRoster(assessmentId);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get Class Roster Status (Instructor)' })
  async getTracking(@Param('id', ParseIntPipe) assessmentId: number) {
    return this.assessmentService.getTracking(assessmentId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Teacher: Get count of submitted vs pending' })
  async getStats(@Param('id', ParseIntPipe) assessmentId: number) {
    return this.assessmentService.getAssessmentStats(assessmentId);
  }

  // --- Grading/Evaluation ---
  // Sub-resource routes are grouped together

  @Post('submission/:id/feedback')
  @ApiOperation({ summary: 'Add Feedback Line by Line (Instructor)' })
  async addFeedbackLineByLine(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) submissionId: number,
    @Body() dto: FeedbackItemDto,
  ) {
    return this.assessmentService.addFeedbackLineByLine(userId, submissionId, dto);
  }

  @Patch('feedback/:feedbackId')
  @ApiOperation({ summary: 'Update Single Feedback Item (Instructor)' })
  async updateSingleFeedback(
    @UserId() userId: number,
    @Param('feedbackId') feedbackId: string,
    @Body() dto: FeedbackItemDto,
  ) {
    return this.assessmentService.updateSingleFeedback(userId, feedbackId, dto);
  }

  @Post('submission/:id/grade')
  @ApiOperation({ summary: 'Grade Submission (Instructor)' })
  async grade(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) submissionId: number,
    @Body() dto: GradeSubmissionDTO,
  ) {
    return this.assessmentService.gradeSubmission(userId, submissionId, dto);
  }

  @Get('submission/:id')
  @ApiOperation({
    summary: 'Get a single submission with files and evaluation',
  })
  async getSubmission(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) submissionId: number,
  ) {
    return this.assessmentService.getSubmissionForViewer(userId, submissionId);
  }
}