import {
    Body, Controller, Post, Get, Param, UseGuards, ParseIntPipe,
    Patch
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubmissionService } from './submission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../../common/decorators/user.decorator';
import { SubmitAssignmentDto } from '../../libs/dtos/submission/submit-assignment.dto';
import { GradeSubmissionDTO } from '../../libs/dtos/submission/grade-submission.dto';
import { FeedbackItemDto } from '../../libs/dtos/submission/feedback-item.dto';

@ApiTags('Submissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionController {
    constructor(private readonly submissionService: SubmissionService) { }

    @Patch('approve/:id')
    async approveSubmission(
        @UserId() teacherId: number,
        @Param('id', ParseIntPipe) submissionId: number,
    ) {
        return this.submissionService.approveSubmission(teacherId, submissionId);
    }

    @Patch(':assessmentId/submit')
    @ApiOperation({ summary: 'Submit Assignment (Student/Team)' })
    async submit(
        @UserId() userId: number,
        @Param('assessmentId', ParseIntPipe) assessmentId: number,
        @Body() submitAssignmentDto: SubmitAssignmentDto,
    ) {
        return this.submissionService.submitAssignment(userId, assessmentId, submitAssignmentDto);
    }


    @Get('my-status/class/:classId')
    @ApiOperation({ summary: 'Student: Check status of all assignments in a class' })
    async getMySubmissionStatus(
        @UserId() userId: number,
        @Param('classId', ParseIntPipe) classId: number,
    ) {
        return this.submissionService.getMySubmissionsStatus(userId, classId);
    }

    @Get(':assessmentId/my-status')
    @ApiOperation({ summary: 'Student: Check my status (Handles Team Sync automatically)' })
    async getMyStatus(
        @UserId() userId: number,
        @Param('assessmentId', ParseIntPipe) assessmentId: number,
    ) {
        return this.submissionService.getMySubmission(userId, assessmentId);
    }

    @Get('assessment/:assessmentId/roster')
    @ApiOperation({ summary: 'Teacher: Get list of all students/teams with SUBMIT/NOT_SUBMIT status' })
    async getStudentStatusList(@Param('assessmentId', ParseIntPipe) assessmentId: number) {
        return this.submissionService.getAssignmentRoster(assessmentId);
    }

    @Get('assessment/:assessmentId/stats')
    @ApiOperation({ summary: 'Teacher: Get count of submitted vs pending' })
    async getStats(@Param('assessmentId', ParseIntPipe) assessmentId: number) {
        return this.submissionService.getAssessmentStats(assessmentId);
    }

    @Post(':id/grade')
    @ApiOperation({ summary: 'Grade Submission (Instructor)' })
    async grade(
        @UserId() userId: number,
        @Param('id', ParseIntPipe) submissionId: number,
        @Body() dto: GradeSubmissionDTO,
    ) {
        return this.submissionService.gradeSubmission(userId, submissionId, dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single submission with files and evaluation' })
    async getSubmission(
        @UserId() userId: number,
        @Param('id', ParseIntPipe) submissionId: number,
    ) {
        return this.submissionService.getSubmissionForViewer(userId, submissionId);
    }

    @Post(':id/feedback')
    @ApiOperation({ summary: 'Add Feedback Line by Line (Instructor)' })
    async addFeedbackLineByLine(
        @UserId() userId: number,
        @Param('id', ParseIntPipe) submissionId: number,
        @Body() dto: FeedbackItemDto,
    ) {
        return this.submissionService.addFeedbackLineByLine(userId, submissionId, dto);
    }

    @Patch('feedback/:feedbackId')
    @ApiOperation({ summary: 'Update Single Feedback Item (Instructor)' })
    async updateSingleFeedback(
        @UserId() userId: number,
        @Param('feedbackId') feedbackId: string,
        @Body() dto: FeedbackItemDto,
    ) {
        return this.submissionService.updateSingleFeedback(userId, feedbackId, dto);
    }
}