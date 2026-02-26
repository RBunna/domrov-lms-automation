import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Repository, In } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AssessmentService } from './assessment.service';
import { Assessment } from '../../libs/entities/assessment/assessment.entity';
import { Resource } from '../../libs/entities/resource/resource.entity';
import { AssessmentResource } from '../../libs/entities/resource/assessment-resource.entity';
import { Enrollment } from '../../libs/entities/classroom/enrollment.entity';
import { Rubrics } from '../../libs/entities/assessment/rubic.entity';
import { Submission } from '../../libs/entities/assessment/submission.entity';
import { Team } from '../../libs/entities/classroom/team.entity';
import { TeamAssessment } from '../../libs/entities/classroom/team-assessment.entity';

import { SubmissionService } from './submission.service';
import { UpdateAssessmentDTO } from '../../libs/dtos/assessment/update-assessment.dto';
import {
    CreateDraftResponseDto,
    PublishAssessmentResponseDto,
    UpdateAssessmentResponseDto,
    AssessmentListItemDto,
    AssessmentDetailDto,
    TeamTrackingItemDto,
    IndividualTrackingItemDto,
    DeleteAssessmentResponseDto,
} from '../../libs/dtos/assessment/assessment-response.dto';

import { SubmissionType, SubmissionMethod } from '../../libs/enums/Assessment';
import type { AssessmentContext, ClassContext } from '../../common/security/dtos/guard.dto';

describe('AssessmentService', () => {
    let assessmentService: AssessmentService;

    let assessmentRepoMock: jest.Mocked<Repository<Assessment>>;
    let resourceRepoMock: jest.Mocked<Repository<Resource>>;
    let assessResRepoMock: jest.Mocked<Repository<AssessmentResource>>;
    let enrollmentRepoMock: jest.Mocked<Repository<Enrollment>>;
    let rubricsRepoMock: jest.Mocked<Repository<Rubrics>>;
    let submissionRepoMock: jest.Mocked<Repository<Submission>>;
    let teamRepoMock: jest.Mocked<Repository<Team>>;
    let teamAssessmentRepoMock: jest.Mocked<Repository<TeamAssessment>>;
    let submissionServiceMock: jest.Mocked<SubmissionService>;

    const mockClassEntity = { id: 100, name: 'Math 101' } as any;

    const mockAssessmentEntity: Assessment = {
        id: 500,
        title: 'Math Assignment 1',
        instruction: 'Solve the problems',
        maxScore: 100,
        submissionType: SubmissionType.INDIVIDUAL,
        allowLate: false,
        session: 1,
        allowTeamSubmition: false,
        startDate: new Date('2025-03-01'),
        dueDate: new Date('2025-03-15'),
        isPublic: false,
        class: mockClassEntity,
        aiEvaluationEnable: false,
        allowedSubmissionMethod: SubmissionMethod.ANY,
        rubrics: [],
        resources: [],
        // Add missing properties with default/mock values
        penaltyCriteria: null,
        user_exclude_files: null,
        user_include_files: null,
        aiModelSelectionMode: null,
        aiModel: null,
        aiPrompt: null,
        aiPromptVariables: null,
        aiPromptTemplate: null,
        aiPromptTemplateVariables: null,
    } as unknown as Assessment;

    const mockAssessmentContext: AssessmentContext = {
        assessmentId: 500,
        userId: 1,
        assessmentEntity: mockAssessmentEntity,
        classContext: { classId: 100, classEntity: mockClassEntity } as any,
    } as AssessmentContext;

    const mockClassContext: ClassContext = {
        classId: 100,
        classEntity: mockClassEntity,
    } as ClassContext;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AssessmentService,
                {
                    provide: getRepositoryToken(Assessment),
                    useValue: {
                        save: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        remove: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Resource),
                    useValue: { findOne: jest.fn() },
                },
                {
                    provide: getRepositoryToken(AssessmentResource),
                    useValue: { create: jest.fn(), save: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Enrollment),
                    useValue: { find: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Rubrics),
                    useValue: { delete: jest.fn(), save: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Submission),
                    useValue: { find: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Team),
                    useValue: { find: jest.fn(), findBy: jest.fn() },
                },
                {
                    provide: getRepositoryToken(TeamAssessment),
                    useValue: { delete: jest.fn(), create: jest.fn(), save: jest.fn() },
                },
                {
                    provide: SubmissionService,
                    useValue: {
                        createSubmissionsForAssessment: jest.fn(),
                    },
                },
            ],
        }).compile();

        assessmentService = module.get<AssessmentService>(AssessmentService);
        assessmentRepoMock = module.get(getRepositoryToken(Assessment)) as jest.Mocked<Repository<Assessment>>;
        resourceRepoMock = module.get(getRepositoryToken(Resource)) as jest.Mocked<Repository<Resource>>;
        assessResRepoMock = module.get(getRepositoryToken(AssessmentResource)) as jest.Mocked<Repository<AssessmentResource>>;
        enrollmentRepoMock = module.get(getRepositoryToken(Enrollment)) as jest.Mocked<Repository<Enrollment>>;
        rubricsRepoMock = module.get(getRepositoryToken(Rubrics)) as jest.Mocked<Repository<Rubrics>>;
        submissionRepoMock = module.get(getRepositoryToken(Submission)) as jest.Mocked<Repository<Submission>>;
        teamRepoMock = module.get(getRepositoryToken(Team)) as jest.Mocked<Repository<Team>>;
        teamAssessmentRepoMock = module.get(getRepositoryToken(TeamAssessment)) as jest.Mocked<Repository<TeamAssessment>>;
        submissionServiceMock = module.get(SubmissionService) as jest.Mocked<SubmissionService>;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createDraft', () => {
        it('ASSESSMENT_CREATEDRAFT_VALID_001 - creates draft and returns ID', async () => {
            const savedAssessment = { ...mockAssessmentEntity, id: 501 };
            assessmentRepoMock.save.mockResolvedValue(savedAssessment as any);

            const result = await assessmentService.createDraft(1, mockClassContext);

            expect(result).toEqual({ message: 'Draft created', assessmentId: 501 });
            expect(assessmentRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Untitled Assignment',
                session: 1,
                class: mockClassEntity,
            }));
        });

        it('ASSESSMENT_CREATEDRAFT_NOCONTEXT_002 - throws NotFoundException when class context missing', async () => {
            const badContext = { ...mockClassContext, classEntity: undefined } as any;
            await expect(assessmentService.createDraft(1, badContext)).rejects.toThrow(
                new NotFoundException('Class context not available')
            );
        });

        it('ASSESSMENT_CREATEDRAFT_SAVEFAIL_003 - throws BadRequestException on save error', async () => {
            assessmentRepoMock.save.mockRejectedValue(new Error('DB error'));
            await expect(assessmentService.createDraft(1, mockClassContext)).rejects.toThrow(
                new BadRequestException('Failed to create draft')
            );
        });
    });

    describe('publishAssessment', () => {
        const publishedAssessment = { ...mockAssessmentEntity, isPublic: true, rubrics: [{ totalScore: 100 }] } as any;

        it('ASSESSMENT_PUBLISH_VALID_001 - publishes when all validations pass', async () => {
            // Ensure rubrics totalScore matches maxScore for validation
            const validAssessment = {
                ...publishedAssessment,
                isPublic: false, // must not be already published
                title: 'Math Assignment 1',
                startDate: new Date('2025-03-01'),
                dueDate: new Date('2025-03-15'),
                maxScore: 100,
                rubrics: [{ totalScore: 100 }],
            };
            assessmentRepoMock.findOne.mockResolvedValue(validAssessment);
            assessmentRepoMock.save.mockResolvedValue({ ...validAssessment, isPublic: true });
            submissionServiceMock.createSubmissionsForAssessment.mockResolvedValue(undefined as any);

            const result = await assessmentService.publishAssessment(mockAssessmentContext);

            expect(result).toEqual({ message: 'Assessment published successfully' });
            expect(assessmentRepoMock.save).toHaveBeenCalled();
            expect(submissionServiceMock.createSubmissionsForAssessment).toHaveBeenCalledWith({ ...validAssessment, isPublic: true });
        });

        it('ASSESSMENT_PUBLISH_NOTFOUND_002 - throws BadRequestException when assessment missing', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(null);
            await expect(assessmentService.publishAssessment(mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Failed to publish assessment')
            );
        });

        it('ASSESSMENT_PUBLISH_ALREADYPUBLIC_003 - throws BadRequestException when already published', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...publishedAssessment, isPublic: true });
            await expect(assessmentService.publishAssessment(mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Assessment already published')
            );
        });

        it('ASSESSMENT_PUBLISH_MISSINGTITLE_004 - throws BadRequestException when title empty', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...publishedAssessment, title: '   ' });
            await expect(assessmentService.publishAssessment(mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Title is required')
            );
        });

        it('ASSESSMENT_PUBLISH_INVALIDDATERANGE_005 - throws BadRequestException when start >= due', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({
                ...publishedAssessment,
                startDate: new Date('2025-03-15'),
                dueDate: new Date('2025-03-01'),
            });
            await expect(assessmentService.publishAssessment(mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Invalid date range')
            );
        });

        it('ASSESSMENT_PUBLISH_RUBRICMISMATCH_006 - throws BadRequestException when rubric total != maxScore', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({
                ...publishedAssessment,
                maxScore: 100,
                rubrics: [{ totalScore: 50 }],
            });
            await expect(assessmentService.publishAssessment(mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Rubric total score must equal maxScore')
            );
        });
    });

    describe('updateAssessment', () => {
        const updateDto: UpdateAssessmentDTO = {
            title: 'Updated Title',
            maxScore: 100,
            resources: [{ resourceId: 10 }],
            rubrics: [{ criterion: 'Quality', weight: 100 }],
        };

        it('ASSESSMENT_UPDATE_VALID_001 - updates metadata, resources, rubrics and team assessments', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, resources: [] } as any);
            resourceRepoMock.findOne.mockResolvedValue({ id: 10 } as any);
            assessResRepoMock.create.mockReturnValue({} as any);
            assessResRepoMock.save.mockResolvedValue({} as any);
            rubricsRepoMock.delete.mockResolvedValue({} as any);
            rubricsRepoMock.save.mockResolvedValue({} as any);
            teamAssessmentRepoMock.delete.mockResolvedValue({} as any);
            teamRepoMock.findBy.mockResolvedValue([{ id: 1 }] as any);
            teamAssessmentRepoMock.create.mockReturnValue({} as any);
            teamAssessmentRepoMock.save.mockResolvedValue({} as any);
            assessmentRepoMock.save.mockResolvedValue({ ...mockAssessmentEntity, title: 'Updated Title' } as any);

            const result = await assessmentService.updateAssessment(updateDto, mockAssessmentContext);

            expect(result.message).toBe('Draft updated successfully');
            expect(assessmentRepoMock.save).toHaveBeenCalled();
            expect(rubricsRepoMock.delete).toHaveBeenCalled();
            expect(teamAssessmentRepoMock.delete).toHaveBeenCalled();
        });

        it('ASSESSMENT_UPDATE_RESOURCENOTFOUND_002 - throws BadRequestException when resource missing', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, resources: [] } as any);
            resourceRepoMock.findOne.mockResolvedValue(null);

            await expect(assessmentService.updateAssessment(updateDto, mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Resource 10 not found')
            );
        });
    });

    describe('getTracking', () => {
        it('ASSESSMENT_GETTRACKING_TEAM_001 - returns team tracking for TEAM submissionType', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, submissionType: SubmissionType.TEAM, isPublic: true } as any);
            submissionRepoMock.find.mockResolvedValue([]);
            teamRepoMock.find.mockResolvedValue([{ id: 1, name: 'Team A' }] as any);

            const result = await assessmentService.getTracking(mockAssessmentContext);

            expect(result).toEqual([{
                teamId: 1,
                name: 'Team A',
                status: 'NOT_SUBMITTED',
                score: null,
            }]);
        });

        it('ASSESSMENT_GETTRACKING_INDIVIDUAL_002 - returns individual tracking for INDIVIDUAL submissionType', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, submissionType: SubmissionType.INDIVIDUAL, isPublic: true } as any);
            submissionRepoMock.find.mockResolvedValue([]);
            enrollmentRepoMock.find.mockResolvedValue([{
                user: { id: 10, firstName: 'Bob', lastName: 'Wilson' },
            }] as any);

            const result = await assessmentService.getTracking(mockAssessmentContext);

            expect(result).toEqual([{
                studentId: 10,
                name: 'Bob Wilson',
                status: 'NOT_SUBMITTED',
                score: null,
            }]);
        });

        it('ASSESSMENT_GETTRACKING_NOTPUBLIC_003 - throws BadRequestException when not published', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, isPublic: false } as any);
            await expect(assessmentService.getTracking(mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Assessment is not published yet')
            );
        });
    });

    describe('findAllByClass', () => {
        it('ASSESSMENT_FINDALLBYCLASS_VALID_001 - returns assessments ordered by dueDate', async () => {
            assessmentRepoMock.find.mockResolvedValue([mockAssessmentEntity] as any);

            const result = await assessmentService.findAllByClass(mockClassContext);

            expect(result).toEqual([mockAssessmentEntity]);
            expect(assessmentRepoMock.find).toHaveBeenCalledWith({
                where: { class: { id: 100 } },
                order: { dueDate: 'ASC' },
                relations: ['resources', 'resources.resource'],
            });
        });

        it('ASSESSMENT_FINDALLBYCLASS_NOCONTEXT_002 - throws NotFoundException', async () => {
            const badContext = { ...mockClassContext, classId: undefined } as any;
            await expect(assessmentService.findAllByClass(badContext)).rejects.toThrow(
                new NotFoundException('Class context not available')
            );
        });
    });

    describe('findAllByClassSession', () => {
        it('ASSESSMENT_FINDALLBYCLASSSESSION_VALID_001 - returns session-specific assessments', async () => {
            assessmentRepoMock.find.mockResolvedValue([mockAssessmentEntity] as any);

            const result = await assessmentService.findAllByClassSession(1, mockClassContext);

            expect(result).toEqual([mockAssessmentEntity]);
        });
    });

    describe('findOne', () => {
        it('ASSESSMENT_FINDONE_VALID_001 - returns full assessment details', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(mockAssessmentEntity as any);

            const result = await assessmentService.findOne(mockAssessmentContext);

            expect(result).toEqual(mockAssessmentEntity);
        });

        it('ASSESSMENT_FINDONE_NOTFOUND_002 - throws NotFoundException', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(null);
            await expect(assessmentService.findOne(mockAssessmentContext)).rejects.toThrow(
                new NotFoundException('Assessment not found')
            );
        });
    });

    describe('deleteAssessment', () => {
        it('ASSESSMENT_DELETE_VALID_001 - deletes assessment entity', async () => {
            assessmentRepoMock.remove.mockResolvedValue({ id: 500 } as any);

            const result = await assessmentService.deleteAssessment(mockAssessmentContext);

            expect(result).toEqual({ id: 500 });
        });

        it('ASSESSMENT_DELETE_NOCONTEXT_002 - throws NotFoundException', async () => {
            const badContext = { ...mockAssessmentContext, assessmentEntity: undefined } as any;
            await expect(assessmentService.deleteAssessment(badContext)).rejects.toThrow(
                new NotFoundException('Assessment context not available')
            );
        });
    });
});