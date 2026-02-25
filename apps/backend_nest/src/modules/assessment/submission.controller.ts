import {
    Body, Controller, Post, Get, Param, UseGuards, ParseIntPipe,
    Patch, HttpCode, HttpStatus
} from '@nestjs/common';
import { 
    ApiBearerAuth, 
    ApiOperation, 
    ApiTags,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiParam,
    ApiBody
} from '@nestjs/swagger';
import { SubmissionService } from './submission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../../common/decorators/user.decorator';
import { SubmitAssignmentDto } from '../../libs/dtos/submission/submit-assignment.dto';
import { GradeSubmissionDTO } from '../../libs/dtos/submission/grade-submission.dto';
import { FeedbackItemDto } from '../../libs/dtos/submission/feedback-item.dto';
import {
    SubmitAssignmentResponseDto,
    ApproveSubmissionResponseDto,
    EvaluationResponseDto,
    SubmissionViewerResponseDto,
    MySubmissionResponseDto,
    SubmissionStatusItemDto,
    TeamRosterItemDto,
    IndividualRosterItemDto,
    AssessmentStatsResponseDto,
    AddFeedbackResponseDto,
    UpdateFeedbackResponseDto,
} from '../../libs/dtos/submission/submission-response.dto';
import { ClassMemberGuard, AssessmentMemberGuard, AssessmentStudentGuard, AssessmentInstructorGuard, AssessmentIdParam, SubmissionMemberGuard, SubmissionInstructorGuard, SubmissionIdParam, GetSubmissionContext, ClassInstructorGuard, SubmissionOwnerGuard } from '../../common/security';
import type { SubmissionContext } from '../../common/security/dtos/guard.dto';

@ApiTags('Submissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionController {
    constructor(private readonly submissionService: SubmissionService) { }

    // ==================== APPROVE SUBMISSION ====================
        @Patch('approve/:id')
        @UseGuards(SubmissionOwnerGuard)
        @SubmissionIdParam('id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Approve submission evaluation',
        description: 'Approves the evaluation for a submission, making the grade visible to the student. Only the class owner (teacher) can approve.'
    })
    @ApiParam({ name: 'id', type: Number, description: 'Submission ID', example: 1 })
    @ApiOkResponse({ 
        description: 'Submission approved successfully',
        type: ApproveSubmissionResponseDto,
        example: {
            message: 'Submission approved successfully',
            submissionId: 1,
            evaluationId: 1,
            isApproved: true
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Submission not found',
        example: {
            statusCode: 404,
            message: 'Submission not found',
            error: 'Not Found'
        }
    })
    @ApiForbiddenResponse({ 
        description: 'Not authorized to approve this submission',
        example: {
            statusCode: 403,
            message: 'You do not have permission to approve this submission',
            error: 'Forbidden'
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Submission has no evaluation yet',
        example: {
            statusCode: 400,
            message: 'Submission has no evaluation yet',
            error: 'Bad Request'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async approveSubmission(
        @GetSubmissionContext() context: SubmissionContext,
    ): Promise<ApproveSubmissionResponseDto> {
        return this.submissionService.approveSubmission(context);
    }

    // ==================== SUBMIT ASSIGNMENT ====================
    @Patch(':assessmentId/submit')
    @UseGuards(AssessmentStudentGuard)
    @AssessmentIdParam('assessmentId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Save or update draft assignment',
        description: 'Save or update a draft submission. Allows students or teams to add or change their submission before final submit.'
    })
    @ApiParam({ name: 'assessmentId', type: Number, description: 'Assessment ID', example: 1 })
    @ApiBody({
        type: SubmitAssignmentDto,
        description: 'Draft submission details',
    })
    async saveDraft(
        @UserId() userId: number,
        @Param('assessmentId', ParseIntPipe) assessmentId: number,
        @Body() submitAssignmentDto: SubmitAssignmentDto,
    ): Promise<SubmitAssignmentResponseDto> {
        return this.submissionService.saveDraftAssignment(userId, assessmentId, submitAssignmentDto);
    }

    // POST: Final submit (change state only, handle queue, prevent duplicate)
    @Post(':assessmentId/submit')
    @UseGuards(AssessmentStudentGuard)
    @AssessmentIdParam('assessmentId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Submit assignment (final)',
        description: 'Final submit of assignment. Changes state, triggers async queue, prevents duplicate submissions.'
    })
    @ApiParam({ name: 'assessmentId', type: Number, description: 'Assessment ID', example: 1 })
    async submit(
        @UserId() userId: number,
        @Param('assessmentId', ParseIntPipe) assessmentId: number,
    ): Promise<SubmitAssignmentResponseDto> {
        return this.submissionService.submitAssignment(userId, assessmentId);
    }

    // POST: Unsubmit (revert to draft, if allowed)
    @Post(':assessmentId/unsubmit')
    @UseGuards(AssessmentStudentGuard)
    @AssessmentIdParam('assessmentId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Unsubmit assignment',
        description: 'Revert a submitted assignment back to draft (if allowed).'
    })
    @ApiParam({ name: 'assessmentId', type: Number, description: 'Assessment ID', example: 1 })
    async unsubmit(
        @UserId() userId: number,
        @Param('assessmentId', ParseIntPipe) assessmentId: number,
    ): Promise<SubmitAssignmentResponseDto> {
        return this.submissionService.unsubmitAssignment(userId, assessmentId);
    }

    // ==================== GET MY SUBMISSIONS STATUS IN CLASS ====================
    @Get('my-status/class/:classId')
    @UseGuards(ClassMemberGuard)
    @ApiOperation({ 
        summary: 'Get status of all assignments in a class (Student)',
        description: 'Returns the submission status, grades, and due dates for all assessments in a class for the authenticated student.'
    })
    @ApiParam({ name: 'classId', type: Number, description: 'Class ID', example: 1 })
    @ApiOkResponse({ 
        description: 'Submission statuses retrieved successfully',
        type: [SubmissionStatusItemDto],
        example: [
            {
                assessmentId: 1,
                title: 'Assignment 1: Data Structures',
                dueDate: '2024-01-20T23:59:59Z',
                status: 'SUBMITTED',
                submissionId: 5,
                grade: 85
            },
            {
                assessmentId: 2,
                title: 'Assignment 2: Algorithms',
                dueDate: '2024-01-27T23:59:59Z',
                status: 'PENDING',
                submissionId: null,
                grade: null
            }
        ]
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async getMySubmissionStatus(
        @UserId() userId: number,
        @Param('classId', ParseIntPipe) classId: number,
    ): Promise<SubmissionStatusItemDto[]> {
        return this.submissionService.getMySubmissionsStatus(userId, classId);
    }

    // ==================== GET MY SUBMISSION FOR ASSESSMENT ====================
    @Get(':assessmentId/my-status')
    @UseGuards(AssessmentMemberGuard)
    @AssessmentIdParam('assessmentId')
    @ApiOperation({ 
        summary: 'Get my submission status for an assessment (Student)',
        description: 'Returns the current user\'s submission details for a specific assessment. Handles team synchronization automatically for team submissions.'
    })
    @ApiParam({ name: 'assessmentId', type: Number, description: 'Assessment ID', example: 1 })
    @ApiOkResponse({ 
        description: 'Submission status retrieved successfully',
        type: MySubmissionResponseDto,
        examples: {
            submitted: {
                summary: 'Submitted assignment',
                value: {
                    id: 1,
                    status: 'SUBMITTED',
                    attemptNumber: 2,
                    submissionTime: '2024-01-15T10:30:00Z',
                    comments: 'My final submission',
                    resources: [
                        { id: 1, title: 'main.cpp', type: 'URL', url: 'https://github.com/user/repo' }
                    ],
                    evaluation: {
                        id: 1,
                        score: 85,
                        feedback: 'Good work!',
                        aiFeedback: null,
                        isApproved: true
                    }
                }
            },
            pending: {
                summary: 'Not submitted yet',
                value: {
                    status: 'PENDING',
                    resources: [],
                    evaluation: null
                }
            },
            notInTeam: {
                summary: 'Not in team (for team assessments)',
                value: {
                    status: 'PENDING',
                    message: 'Not in an allowed team for this assessment',
                    resources: [],
                    evaluation: null
                }
            }
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Assessment not found',
        example: {
            statusCode: 404,
            message: 'Assessment not found',
            error: 'Not Found'
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Assessment is not public',
        example: {
            statusCode: 400,
            message: 'Assessment not found',
            error: 'Bad Request'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async getMyStatus(
        @UserId() userId: number,
        @Param('assessmentId', ParseIntPipe) assessmentId: number,
    ): Promise<MySubmissionResponseDto> {
        return this.submissionService.getMySubmission(userId, assessmentId);
    }

    // ==================== GET ASSIGNMENT ROSTER ====================
    @Get('assessment/:assessmentId/roster')
    @UseGuards(AssessmentInstructorGuard)
    @AssessmentIdParam('assessmentId')
    @ApiOperation({ 
        summary: 'Get submission roster for an assessment (Teacher)',
        description: 'Returns a list of all students/teams with their submission status, scores, and submission times. Response format depends on assessment submission type.'
    })
    @ApiParam({ name: 'assessmentId', type: Number, description: 'Assessment ID', example: 1 })
    @ApiOkResponse({ 
        description: 'Roster retrieved successfully',
        schema: {
            oneOf: [
                { type: 'array', items: { $ref: '#/components/schemas/TeamRosterItemDto' } },
                { type: 'array', items: { $ref: '#/components/schemas/IndividualRosterItemDto' } }
            ]
        },
        examples: {
            teamRoster: {
                summary: 'Team submission roster',
                value: [
                    {
                        type: 'TEAM',
                        id: 1,
                        name: 'Team Alpha',
                        members: [
                            { userId: 1, fullName: 'John Doe', profileUrl: 'https://example.com/avatar.jpg' },
                            { userId: 2, fullName: 'Jane Smith', profileUrl: null }
                        ],
                        status: 'SUBMITTED',
                        submissionId: 5,
                        score: 85,
                        submittedAt: '2024-01-15T10:30:00Z'
                    }
                ]
            },
            individualRoster: {
                summary: 'Individual submission roster',
                value: [
                    {
                        type: 'INDIVIDUAL',
                        id: 1,
                        name: 'John Doe',
                        email: 'john@example.com',
                        profileUrl: 'https://example.com/avatar.jpg',
                        status: 'SUBMITTED',
                        submissionId: 5,
                        score: 85,
                        submittedAt: '2024-01-15T10:30:00Z'
                    },
                    {
                        type: 'INDIVIDUAL',
                        id: 2,
                        name: 'Jane Smith',
                        email: 'jane@example.com',
                        profileUrl: null,
                        status: 'NOT_SUBMITTED',
                        submissionId: null,
                        score: null,
                        submittedAt: null
                    }
                ]
            }
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Assessment not found',
        example: {
            statusCode: 404,
            message: 'Assessment not found',
            error: 'Not Found'
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Assessment is not public',
        example: {
            statusCode: 400,
            message: 'Assessment not found',
            error: 'Bad Request'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async getStudentStatusList(
        @Param('assessmentId', ParseIntPipe) assessmentId: number,
    ): Promise<TeamRosterItemDto[] | IndividualRosterItemDto[]> {
        return this.submissionService.getAssignmentRoster(assessmentId);
    }

    // ==================== GET ASSESSMENT STATS ====================
    @Get('assessment/:assessmentId/stats')
    @UseGuards(AssessmentInstructorGuard)
    @AssessmentIdParam('assessmentId')
    @ApiOperation({ 
        summary: 'Get assessment submission statistics (Teacher)',
        description: 'Returns aggregate statistics about submissions for an assessment including total count, submitted count, pending count, and graded count.'
    })
    @ApiParam({ name: 'assessmentId', type: Number, description: 'Assessment ID', example: 1 })
    @ApiOkResponse({ 
        description: 'Statistics retrieved successfully',
        type: AssessmentStatsResponseDto,
        example: {
            totalStudentsOrTeams: 30,
            submittedCount: 25,
            pendingCount: 5,
            gradedCount: 20
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Assessment not found',
        example: {
            statusCode: 404,
            message: 'Assessment not found',
            error: 'Not Found'
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Assessment is not public',
        example: {
            statusCode: 400,
            message: 'Assessment not found',
            error: 'Bad Request'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async getStats(
        @Param('assessmentId', ParseIntPipe) assessmentId: number,
    ): Promise<AssessmentStatsResponseDto> {
        return this.submissionService.getAssessmentStats(assessmentId);
    }

    // ==================== GRADE SUBMISSION ====================
        @Post(':id/grade')
        @UseGuards(SubmissionInstructorGuard)
        @SubmissionIdParam('id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Grade a submission (Teacher)',
        description: 'Manually grades a submission with a score and optional feedback. Only the class owner can grade submissions.'
    })
    @ApiParam({ name: 'id', type: Number, description: 'Submission ID', example: 1 })
    @ApiBody({ 
        type: GradeSubmissionDTO,
        description: 'Grading details',
        examples: {
            withFeedback: {
                summary: 'Grade with feedback',
                value: {
                    score: 85,
                    feedback: 'Good work! Consider improving code structure.'
                }
            },
            scoreOnly: {
                summary: 'Grade without feedback',
                value: {
                    score: 90
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Submission graded successfully',
        type: EvaluationResponseDto,
        example: {
            id: 1,
            score: 85,
            feedback: 'Good work!',
            penaltyScore: 0,
            isApproved: false,
            isModified: false,
            evaluationType: 'MANUAL',
            aiOutput: null,
            confidencePoint: null,
            feedbacks: [],
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z'
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Submission not found',
        example: {
            statusCode: 404,
            message: 'Submission not found',
            error: 'Not Found'
        }
    })
    @ApiForbiddenResponse({ 
        description: 'Not authorized to grade this submission',
        example: {
            statusCode: 403,
            message: 'You do not have permission to grade this submission',
            error: 'Forbidden'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async grade(
        @GetSubmissionContext() context: SubmissionContext,
        @Body() dto: GradeSubmissionDTO,
    ): Promise<EvaluationResponseDto> {
        return this.submissionService.gradeSubmission(context, dto);
    }

    // ==================== GET SUBMISSION DETAILS ====================
        @Get(':id')
        @UseGuards(SubmissionMemberGuard)
        @SubmissionIdParam('id')
    @ApiOperation({ 
        summary: 'Get submission details (Teacher)',
        description: 'Returns detailed information about a submission including files, evaluation, team/user info. Accessible by the submission owner, team members, or the class teacher.'
    })
    @ApiParam({ name: 'id', type: Number, description: 'Submission ID', example: 1 })
    @ApiOkResponse({ 
        description: 'Submission details retrieved successfully',
        type: SubmissionViewerResponseDto,
        example: {
            id: 1,
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            submissionTime: '2024-01-15T10:30:00Z',
            status: 'SUBMITTED',
            attemptNumber: 1,
            user: { id: 1, firstName: 'John', lastName: 'Doe' },
            team: null,
            assessment: {
                id: 1,
                title: 'Assignment 1',
                maxScore: 100,
                class: { id: 1, name: 'Data Structures' }
            },
            evaluation: {
                id: 1,
                score: 85,
                feedback: 'Good work!',
                penaltyScore: 0,
                isApproved: true,
                isModified: false,
                evaluationType: 'MANUAL',
                aiOutput: null,
                confidencePoint: null,
                feedbacks: [],
                created_at: '2024-01-15T10:30:00Z',
                updated_at: '2024-01-15T10:30:00Z'
            },
            resources: [
                {
                    id: 1,
                    resource: { id: 1, title: 'main.cpp', type: 'URL', url: 'https://github.com/user/repo' }
                }
            ]
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Submission not found',
        example: {
            statusCode: 404,
            message: 'Submission not found',
            error: 'Not Found'
        }
    })
    @ApiForbiddenResponse({ 
        description: 'Not authorized to view this submission',
        example: {
            statusCode: 403,
            message: 'You do not have permission to view this submission',
            error: 'Forbidden'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async getSubmission(
        @GetSubmissionContext() context: SubmissionContext,
    ): Promise<SubmissionViewerResponseDto> {
        return this.submissionService.getSubmissionForViewer(context);
    }

    // ==================== ADD LINE-BY-LINE FEEDBACK ====================
        @Post(':id/feedback')
        @UseGuards(SubmissionInstructorGuard)
        @SubmissionIdParam('id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Add line-by-line feedback (Teacher)',
        description: 'Adds a code review feedback item to a submission. Allows teachers to provide specific feedback on code lines.'
    })
    @ApiParam({ name: 'id', type: Number, description: 'Submission ID', example: 1 })
    @ApiBody({ 
        type: FeedbackItemDto,
        description: 'Feedback details',
        examples: {
            suggestion: {
                summary: 'Code suggestion',
                value: {
                    path: 'src/main.cpp',
                    startLine: 10,
                    endLine: 15,
                    message: 'Consider using a more descriptive variable name',
                    type: 'suggestion'
                }
            },
            error: {
                summary: 'Error feedback',
                value: {
                    path: 'src/utils.cpp',
                    startLine: 25,
                    endLine: 25,
                    message: 'Memory leak: missing delete statement',
                    type: 'error'
                }
            },
            warning: {
                summary: 'Warning feedback',
                value: {
                    path: 'src/handler.cpp',
                    startLine: 50,
                    endLine: 55,
                    message: 'This function is too complex, consider refactoring',
                    type: 'warning'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Feedback added successfully',
        type: AddFeedbackResponseDto,
        example: {
            message: 'Feedback item added successfully',
            evaluationId: 1,
            addedItemsCount: 1
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Submission not found',
        example: {
            statusCode: 404,
            message: 'Submission not found',
            error: 'Not Found'
        }
    })
    @ApiForbiddenResponse({ 
        description: 'Not authorized to add feedback',
        example: {
            statusCode: 403,
            message: 'You do not have permission to evaluate this submission',
            error: 'Forbidden'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async addFeedbackLineByLine(
        @GetSubmissionContext() context: SubmissionContext,
        @Body() dto: FeedbackItemDto,
    ): Promise<AddFeedbackResponseDto> {
        return this.submissionService.addFeedbackLineByLine(context, dto);
    }

    // ==================== UPDATE SINGLE FEEDBACK ====================
        @Patch('feedback/:feedbackId')
        @UseGuards(SubmissionOwnerGuard)
        @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Update a feedback item (Teacher)',
        description: 'Updates an existing code review feedback item. Only the class owner can update feedback.'
    })
    @ApiParam({ name: 'feedbackId', type: String, description: 'Feedback UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @ApiBody({ 
        type: FeedbackItemDto,
        description: 'Updated feedback details',
        examples: {
            update: {
                summary: 'Update feedback',
                value: {
                    path: 'src/main.cpp',
                    startLine: 12,
                    endLine: 18,
                    message: 'Updated: Consider extracting this logic into a separate function',
                    type: 'suggestion'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Feedback updated successfully',
        type: UpdateFeedbackResponseDto,
        example: {
            message: 'Feedback item updated successfully',
            feedbackId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
        }
    })
    @ApiNotFoundResponse({ 
        description: 'Feedback item not found',
        example: {
            statusCode: 404,
            message: 'Feedback item not found',
            error: 'Not Found'
        }
    })
    @ApiForbiddenResponse({ 
        description: 'Not authorized to update this feedback',
        example: {
            statusCode: 403,
            message: 'You do not have permission to update this feedback',
            error: 'Forbidden'
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
        }
    })
    async updateSingleFeedback(
        @UserId() userId: number,
        @Param('feedbackId') feedbackId: string,
        @Body() dto: FeedbackItemDto,
    ): Promise<UpdateFeedbackResponseDto> {
        return this.submissionService.updateSingleFeedback(userId, feedbackId, dto);
    }
}