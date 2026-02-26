import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Repository } from 'typeorm';
import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { SubmissionService } from './submission.service';
import { Assessment } from '../../libs/entities/assessment/assessment.entity';
import { Submission } from '../../libs/entities/assessment/submission.entity';
import { Resource } from '../../libs/entities/resource/resource.entity';
import { SubmissionResource } from '../../libs/entities/resource/submission-resource.entity';
import { Evaluation } from '../../libs/entities/assessment/evaluation.entity';
import { Team } from '../../libs/entities/classroom/team.entity';
import { Enrollment } from '../../libs/entities/classroom/enrollment.entity';
import { EvaluationFeedback } from '../../libs/entities/assessment/evaluation-feedback.entity';
import { UserAIKey } from '../../libs/entities/ai/user-ai-key.entity';

import { WalletService } from '../wallet/wallet.service';
import { EvaluationService } from '../evaluation/evaluation.service';

import { SubmitAssignmentDto } from '../../libs/dtos/submission/submit-assignment.dto';
import { GradeSubmissionDTO } from '../../libs/dtos/submission/grade-submission.dto';

import {
    SubmitAssignmentResponseDto,
    ApproveSubmissionResponseDto,
    EvaluationResponseDto,
    SubmissionViewerResponseDto,
    MySubmissionResponseDto,
    SubmissionStatusItemDto,
    AssessmentStatsResponseDto,
    SubmissionResourceUrlResponseDto,
} from '../../libs/dtos/submission/submission-response.dto';

import { SubmissionStatus } from '../../libs/enums/Status';
import { SubmissionType, SubmissionMethod } from '../../libs/enums/Assessment';
import type { SubmissionContext } from '../../common/security/dtos/guard.dto';
import { TeamAssessment } from '../../libs/entities/classroom/team-assessment.entity';

describe('SubmissionService', () => {
    let submissionService: SubmissionService;

    let assessmentRepoMock: jest.Mocked<Repository<Assessment>>;
    let submissionRepoMock: jest.Mocked<Repository<Submission>>;
    let resourceRepoMock: jest.Mocked<Repository<Resource>>;
    let subResourceRepoMock: jest.Mocked<Repository<SubmissionResource>>;
    let evaluationRepoMock: jest.Mocked<Repository<Evaluation>>;
    let teamRepoMock: jest.Mocked<Repository<Team>>;
    let enrollmentRepoMock: jest.Mocked<Repository<Enrollment>>;
    let evaluationFeedbackRepoMock: jest.Mocked<Repository<EvaluationFeedback>>;
    let userAIKeyRepoMock: jest.Mocked<Repository<UserAIKey>>;

    let walletServiceMock: jest.Mocked<WalletService>;
    let aiEvaluationServiceMock: jest.Mocked<EvaluationService>;

    const mockDate = new Date('2025-03-01T10:00:00Z');

    const mockAssessment: Assessment = {
        id: 100,
        title: 'Math Assignment',
        submissionType: SubmissionType.INDIVIDUAL,
        isPublic: true,
        dueDate: new Date('2025-03-15'),
        allowLate: true,
        allowedSubmissionMethod: SubmissionMethod.ANY,
        aiEvaluationEnable: true,
        aiModelSelectionMode: 'SYSTEM',
        user_exclude_files: [],
        user_include_files: [],
        instruction: 'Solve the math problems.',
        maxScore: 100,
        class: {
            id: 10,
            name: 'Math 101',
            enrollments: [{ user: { id: 1 } as any }, { user: { id: 2 } as any }],
            owner: { id: 42 } as any,
        } as any,
        rubrics: [],
    } as Assessment;

    const mockSubmission: Submission = {
        id: 500,
        userId: 1,
        created_at: mockDate,
        updated_at: mockDate,
        assessment: mockAssessment,
        status: SubmissionStatus.PENDING,
        attemptNumber: 1,
        submissionTime: null,
        comments: null,
        user: { id: 1, firstName: 'John', lastName: 'Doe' } as any,
        resources: [],
        evaluation: null,
    } as Submission;

    const mockTeamSubmission: Submission = {
        id: 501,
        userId: null,
        created_at: mockDate,
        updated_at: mockDate,
        assessment: { ...mockAssessment, submissionType: SubmissionType.TEAM },
        status: SubmissionStatus.PENDING,
        team: { id: 200, name: 'Team Alpha', maxMember: 5, members: [] } as any,
        resources: [],
        evaluation: null,
    } as Submission;

    const mockSubmissionContext: SubmissionContext = {
        submissionId: 500,
        userId: 1,
        submissionEntity: mockSubmission,
        classContext: { classId: 10 } as any,
    } as SubmissionContext;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubmissionService,
                {
                    provide: getRepositoryToken(Assessment),
                    useValue: { findOne: jest.fn(), find: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Submission),
                    useValue: { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), create: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Enrollment),
                    useValue: {
                        createQueryBuilder: jest.fn(() => ({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                            getMany: jest.fn().mockResolvedValue([
                                { id: 1, user: { id: 101, firstName: 'Alice' } },
                                { id: 2, user: { id: 102, firstName: 'Bob' } },
                            ]),
                        })),
                    },
                },
                {
                    provide: getRepositoryToken(TeamAssessment),
                    useValue: {
                        createQueryBuilder: jest.fn(() => ({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                            getMany: jest.fn().mockResolvedValue([
                                { id: 1, team: { id: 201, name: 'Team A' } },
                                { id: 2, team: { id: 202, name: 'Team B' } },
                            ]),
                        })),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: WalletService,
                    useValue: { getBalance: jest.fn() },
                },
                {
                    provide: EvaluationService,
                    useValue: { addTaskToQueue: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Resource),
                    useValue: { findOne: jest.fn(), save: jest.fn() },
                },
                {
                    provide: getRepositoryToken(SubmissionResource),
                    useValue: { delete: jest.fn(), create: jest.fn(), save: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Evaluation),
                    useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Team),
                    useValue: { find: jest.fn() },
                },
                {
                    provide: getRepositoryToken(EvaluationFeedback),
                    useValue: { create: jest.fn(), save: jest.fn() },
                },
                {
                    provide: getRepositoryToken(UserAIKey),
                    useValue: { findOne: jest.fn() },
                },
            ],

        }).compile();

        submissionService = module.get<SubmissionService>(SubmissionService);
        submissionService = module.get<SubmissionService>(SubmissionService);
        submissionRepoMock = module.get(getRepositoryToken(Submission));
        assessmentRepoMock = module.get(getRepositoryToken(Assessment));
        resourceRepoMock = module.get(getRepositoryToken(Resource)) as jest.Mocked<Repository<Resource>>;
        subResourceRepoMock = module.get(getRepositoryToken(SubmissionResource)) as jest.Mocked<Repository<SubmissionResource>>;
        evaluationRepoMock = module.get(getRepositoryToken(Evaluation)) as jest.Mocked<Repository<Evaluation>>;
        teamRepoMock = module.get(getRepositoryToken(Team)) as jest.Mocked<Repository<Team>>;
        enrollmentRepoMock = module.get(getRepositoryToken(Enrollment)) as jest.Mocked<Repository<Enrollment>>;
        evaluationFeedbackRepoMock = module.get(getRepositoryToken(EvaluationFeedback)) as jest.Mocked<Repository<EvaluationFeedback>>;
        userAIKeyRepoMock = module.get(getRepositoryToken(UserAIKey)) as jest.Mocked<Repository<UserAIKey>>;
        walletServiceMock = module.get(WalletService) as jest.Mocked<WalletService>;
        aiEvaluationServiceMock = module.get(EvaluationService) as jest.Mocked<EvaluationService>;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createSubmissionsForAssessment', () => {
        it('SUBMISSION_CREATESUBMISSIONS_VALID_INDIVIDUAL_001 - creates submissions for individual assessment', async () => {
            // Properly mocked assessment including class with id
            const assessmentWithRelations = {
                ...mockAssessment,
                submissionType: SubmissionType.INDIVIDUAL,
                class: { id: 10, enrollments: [{ user: { id: 101 } }, { user: { id: 102 } }] },
            } as any;

            assessmentRepoMock.findOne.mockResolvedValue(assessmentWithRelations);
            submissionRepoMock.save.mockResolvedValue([]); // save resolves once with array

            await submissionService.createSubmissionsForAssessment(assessmentWithRelations);
            const savedArg = submissionRepoMock.save.mock.calls[0][0];
            expect(savedArg[0]).toHaveProperty('user.id', 101);
            expect(savedArg[1]).toHaveProperty('user.id', 102);
        });

        it('SUBMISSION_CREATESUBMISSIONS_VALID_TEAM_002 - creates submissions for team assessment', async () => {
            const assessmentWithRelations = {
                ...mockAssessment,
                submissionType: SubmissionType.TEAM,
                teamAssessments: [{ team: { id: 200 } }],
                class: { id: 10 },
            } as any;
            assessmentRepoMock.findOne.mockResolvedValue(assessmentWithRelations);
            submissionRepoMock.save.mockResolvedValue({ id: 501 } as any);

            await submissionService.createSubmissionsForAssessment(mockAssessment);

            expect(submissionRepoMock.save).toHaveBeenCalledTimes(1);
        });

        it('SUBMISSION_CREATESUBMISSIONS_NOTFOUND_003 - throws BadRequestException when assessment not found', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(null);
            await expect(submissionService.createSubmissionsForAssessment(mockAssessment)).rejects.toThrow(
                new BadRequestException('Failed to create submissions for assessment')
            );
        });
    });

    describe('saveDraftAssignment', () => {
        const validDto: SubmitAssignmentDto = { comments: 'My draft', resources: [{ resourceId: 10 }] };

        it('SUBMISSION_SAVEDRAFT_VALID_INDIVIDUAL_001 - creates/updates individual draft', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(mockAssessment);
            submissionRepoMock.findOne.mockResolvedValue(null);
            submissionRepoMock.create.mockReturnValue(mockSubmission);
            submissionRepoMock.save.mockResolvedValue({ ...mockSubmission, id: 500 });
            resourceRepoMock.findOne.mockResolvedValue({ id: 10 } as any);
            subResourceRepoMock.create.mockReturnValue({} as any);
            subResourceRepoMock.save.mockResolvedValue({} as any);

            const result = await submissionService.saveDraftAssignment(1, 100, validDto);

            expect(result).toEqual({ message: 'Draft saved', submissionId: 500 });
        });

        it('SUBMISSION_SAVEDRAFT_VALID_TEAM_002 - creates/updates team draft', async () => {
            const teamAssessment = {
                ...mockAssessment,
                submissionType: SubmissionType.TEAM,
                teamAssessments: [{ team: { id: 200, members: [{ user: { id: 1 } }] } }],
            } as any;
            assessmentRepoMock.findOne.mockResolvedValue(teamAssessment);
            submissionRepoMock.findOne.mockResolvedValue(null);
            submissionRepoMock.create.mockReturnValue(mockTeamSubmission);
            submissionRepoMock.save.mockResolvedValue({ ...mockTeamSubmission, id: 501 });

            const result = await submissionService.saveDraftAssignment(1, 100, validDto);

            expect(result).toEqual({ message: 'Draft saved', submissionId: 501 });
        });

        it('SUBMISSION_SAVEDRAFT_NOTENROLLED_003 - throws ForbiddenException', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessment, class: { enrollments: [] } } as any);
            await expect(submissionService.saveDraftAssignment(999, 100, validDto)).rejects.toThrow(
                new ForbiddenException('Not enrolled in class')
            );
        });

        it('SUBMISSION_SAVEDRAFT_GRADED_004 - throws BadRequestException when already graded', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(mockAssessment);
            submissionRepoMock.findOne.mockResolvedValue({ ...mockSubmission, status: SubmissionStatus.GRADED });
            await expect(submissionService.saveDraftAssignment(1, 100, validDto)).rejects.toThrow(
                new BadRequestException('Cannot edit after grading')
            );
        });
    });

    describe('getSubmissionForViewer', () => {
        it('SUBMISSION_GETFORVIEWER_VALID_001 - returns full viewer DTO', async () => {
            const ctx = { ...mockSubmissionContext, submissionEntity: mockSubmission } as any;
            const result = await submissionService.getSubmissionForViewer(ctx);

            expect(result).toEqual(expect.objectContaining({
                id: 500,
                status: SubmissionStatus.PENDING,
                user: expect.any(Object),
                team: null,
            }));
        });
    });

    describe('getMySubmission', () => {
        it('SUBMISSION_GETMY_VALID_INDIVIDUAL_001 - returns my submission (approved)', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(mockAssessment);
            submissionRepoMock.findOne.mockResolvedValue({
                ...mockSubmission,
                evaluation: { id: 800, isApproved: true, score: 90 } as any,
            });

            const result = await submissionService.getMySubmission(1, 100);

            expect(result).toEqual(expect.objectContaining({
                id: 500,
                evaluation: expect.objectContaining({ score: 90, isApproved: true }),
            }));
        });

        it('SUBMISSION_GETMY_NOTSUBMITTED_002 - returns pending status', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(mockAssessment);
            submissionRepoMock.findOne.mockResolvedValue(null);

            const result = await submissionService.getMySubmission(1, 100);

            expect(result).toEqual({
                status: SubmissionStatus.PENDING,
                resources: [],
                evaluation: null,
            });
        });
    });

    describe('getMySubmissionsStatus', () => {
        it('SUBMISSION_GETMYSTATUS_VALID_001 - returns status list', async () => {
            assessmentRepoMock.find.mockResolvedValue([mockAssessment]);
            submissionRepoMock.find.mockResolvedValue([mockSubmission]);

            const result = await submissionService.getMySubmissionsStatus(1, 10);

            expect(result).toEqual([expect.objectContaining({ assessmentId: 100, status: SubmissionStatus.PENDING })]);
        });
    });

    describe('getAssignmentRoster', () => {
        it('SUBMISSION_GETROSTER_TEAM_001 - returns team roster', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessment, submissionType: SubmissionType.TEAM, class: { id: 10 } } as any);
            teamRepoMock.find.mockResolvedValue([{ id: 200, name: 'Team A', members: [] }] as any);
            submissionRepoMock.find.mockResolvedValue([]);

            const result = await submissionService.getAssignmentRoster(100);

            expect(result).toEqual([expect.objectContaining({ type: 'TEAM', id: 200 })]);
        });
    });

    describe('getAssessmentStats', () => {
        it('SUBMISSION_GETSTATS_VALID_001 - returns stats', async () => {
            const roster = [
                { status: 'SUBMITTED' },
                { status: 'NOT_SUBMITTED' },
                { status: 'GRADED' },
            ] as any;
            jest.spyOn(submissionService, 'getAssignmentRoster').mockResolvedValue(roster);

            const result = await submissionService.getAssessmentStats(100);

            expect(result).toEqual({
                totalStudentsOrTeams: 3,
                submittedCount: 2,
                pendingCount: 1,
                gradedCount: 1,
            });
        });
    });

    describe('getSubmissionDetails', () => {
        it('SUBMISSION_GETDETAILS_VALID_001 - returns AI-ready payload', async () => {
            const fullSubmission = {
                ...mockSubmission,
                userId: 1,
                assessment: { ...mockAssessment, allowedSubmissionMethod: SubmissionMethod.ANY, aiEvaluationEnable: true },
                resources: [],
                evaluation: null,
            } as any;

            submissionRepoMock.findOne.mockResolvedValue(fullSubmission);
            walletServiceMock.getBalance.mockResolvedValue(100);

            const result = await submissionService.getSubmissionDetails(500);

            expect(result).toEqual(expect.objectContaining({
                submission_id: '500',
                resource_url: expect.any(String),
            }));
        });
    });

    describe('getSubmissionResoucrs', () => {
        it('SUBMISSION_GETRESOURCES_VALID_001 - returns resource URL', async () => {
            const fullSubmission = {
                ...mockSubmission,
                userId: 1,
                assessment: { ...mockAssessment, allowedSubmissionMethod: SubmissionMethod.ANY },
                resources: [],
            } as any;

            submissionRepoMock.findOne.mockResolvedValue(fullSubmission);

            const result = await submissionService.getSubmissionResoucrs(500);

            expect(result).toEqual({ resource_url: expect.any(String) });
        });
    });
});