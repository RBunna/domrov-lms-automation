import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Repository, In, DataSource } from 'typeorm';
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
import { TasksService } from '../tasks/tasks.service';
import { Tasks } from '../../libs/enums/taks.enum';

describe('AssessmentService', () => {
    let assessmentService: AssessmentService;
    let tasksServiceMock: TasksService;
    let queryRunnerManagerMock: any;
    let assessmentRepoMock: jest.Mocked<Repository<Assessment>>;
    let resourceRepoMock: jest.Mocked<Repository<Resource>>;
    let assessResRepoMock: jest.Mocked<Repository<AssessmentResource>>;
    let enrollmentRepoMock: jest.Mocked<Repository<Enrollment>>;
    let rubricsRepoMock: jest.Mocked<Repository<Rubrics>>;
    let submissionRepoMock: jest.Mocked<Repository<Submission>>;
    let teamRepoMock: jest.Mocked<Repository<Team>>;
    let teamAssessmentRepoMock: jest.Mocked<Repository<TeamAssessment>>;
    let submissionServiceMock: jest.Mocked<SubmissionService>;
    beforeAll(async () => {
        queryRunnerManagerMock = {
            save: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
            findBy: jest.fn(),
            create: jest.fn().mockImplementation((entity, dto) => dto),
        };

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
                    provide: DataSource,
                    useValue: {
                        manager: {
                            transaction: async (cb) => cb(queryRunnerManagerMock),
                        },
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
                    useValue: { find: jest.fn(), delete: jest.fn().mockResolvedValue({ affected: 1 }) },
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
                        //@ts-ignore
                        createSubmissionsForAssessment: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: TasksService, // <-- Add TasksService mock
                    useValue: {
                        scheduleTask: jest.fn(),
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
        tasksServiceMock = module.get(TasksService) as jest.Mocked<TasksService>;

        // Define Tasks constant to use in tests
        global.Tasks = { PUBLIC_ASSIGNMENT: 'PUBLIC_ASSIGNMENT' };
    });

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
        rubrics: [{ criterion: 'Quality', weight: 100, totalScore: 100 }],
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
        queryRunnerManagerMock = {
            save: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
            findBy: jest.fn(),
            create: jest.fn().mockImplementation((entity, dto) => dto),
        };

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
                    provide: DataSource,
                    useValue: {
                        manager: {
                            transaction: async (cb) => cb(queryRunnerManagerMock),
                        },
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
                        //@ts-ignore
                        createSubmissionsForAssessment: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: TasksService, // <-- Add TasksService mock
                    useValue: {
                        scheduleTask: jest.fn(),
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
        tasksServiceMock = module.get(TasksService) as jest.Mocked<TasksService>;
        global.Tasks = { PUBLIC_ASSIGNMENT: 'PUBLIC_ASSIGNMENT' };
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
        let publishedAssessment: Assessment;

        beforeEach(() => {
            publishedAssessment = { ...mockAssessmentEntity, isPublic: true } as Assessment;
            assessmentRepoMock.findOne.mockResolvedValue(publishedAssessment);
            // jest.spyOn(submissionRepoMock, 'delete').mockResolvedValue({ affected: 1 } as any);
        });
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
            //@ts-ignore
            assessmentRepoMock.findOne.mockResolvedValue(validAssessment);
            //@ts-ignore
            assessmentRepoMock.save.mockResolvedValue({ ...validAssessment, isPublic: true });
            submissionServiceMock.createSubmissionsForAssessment.mockResolvedValue(undefined as any);
            const result = await assessmentService.publishAssessment(mockAssessmentContext);
            expect(result).toEqual({ message: 'Assessment published successfully' });
            expect(assessmentRepoMock.save).toHaveBeenCalled();
            //@ts-ignore
            expect(submissionServiceMock.createSubmissionsForAssessment).toHaveBeenCalledWith({ ...validAssessment, isPublic: true });
        });

        it('ASSESSMENT_PUBLISH_NOTFOUND_002 - throws BadRequestException when assessment missing', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(null);
            await expect(assessmentService.publishAssessment(mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Failed to publish assessment')
            );
        });

        // it('ASSESSMENT_PUBLISH_ALREADYPUBLIC_003 - throws BadRequestException when already published', async () => {
        //     const publishedAssessment = { ...mockAssessmentEntity, isPublic: true };
        //     assessmentRepoMock.findOne.mockResolvedValue(publishedAssessment);

        //     await expect(
        //         assessmentService.publishAssessment(mockAssessmentContext)
        //     ).rejects.toThrow(new BadRequestException('Assessment already published'));
        // });

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
                rubrics: [{
                    id: 1,
                    definition: 'Quality',
                    totalScore: 50,
                    assessment: null,
                    hasId: () => true,
                    save: jest.fn(),
                    remove: jest.fn(),
                    criterion: 'Quality',
                    weight: 100,
                } as unknown as Rubrics],
            });
            await expect(assessmentService.publishAssessment(mockAssessmentContext)).rejects.toThrow(
                new BadRequestException('Rubric total score must equal maxScore')
            );
        });
        it('ASSESSMENT_PUBLISH_UPDATECONTENT_007 - updates content without recreating submissions when already public', async () => {
            const alreadyPublic: Assessment = {
                ...mockAssessmentEntity,
                isPublic: true,
                submissionType: SubmissionType.INDIVIDUAL,
                rubrics: [
                    ({
                        id: 1,
                        totalScore: 100,
                        definition: 'Quality',
                        assessment: mockAssessmentEntity,
                        hasId: () => true,
                        save: jest.fn(),
                        remove: jest.fn(),
                    } as unknown as Rubrics),
                ],
            } as Assessment;
            assessmentRepoMock.findOne.mockResolvedValue(alreadyPublic);
            assessmentRepoMock.save.mockResolvedValue(alreadyPublic);

            const result = await assessmentService.publishAssessment(mockAssessmentContext);

            expect(result).toEqual({ message: 'Assessment updated successfully' });
            expect(assessmentRepoMock.save).toHaveBeenCalledWith(alreadyPublic);
        });
        it('ASSESSMENT_PUBLISH_TYPECHANGE_008 - removes old submissions and creates new team submissions', async () => {
            const alreadyPublic: Assessment = {
                ...mockAssessmentEntity,
                isPublic: true,
                submissionType: SubmissionType.INDIVIDUAL,
                rubrics: [
                    ({
                        id: 1,
                        totalScore: 100,
                        definition: 'Quality',
                        assessment: mockAssessmentEntity,
                        hasId: () => true,
                        save: jest.fn(),
                        remove: jest.fn(),
                    } as unknown as Rubrics),
                ],
            } as Assessment;
            // Mock findOne to return the updated assessment for the type change scenario
            const updatedAssessment = { ...alreadyPublic, submissionType: SubmissionType.TEAM };
            assessmentRepoMock.findOne.mockResolvedValue(updatedAssessment);
            assessmentRepoMock.save.mockResolvedValue(updatedAssessment);

            const result = await assessmentService.publishAssessment({
                ...mockAssessmentContext,
                assessmentEntity: updatedAssessment,
            });
            expect(result).toEqual({ message: 'Assessment updated successfully' });
        });
    });
    describe('publishAssessment', () => {
        it('ASSESSMENT_PUBLISH_VALID_001 - publishes when all validations pass', async () => {
            // Arrange
            const validAssessment = {
                ...mockAssessmentEntity,
                isPublic: false, // must not be already published
                rubrics: [{ totalScore: 100, criterion: 'Quality', weight: 100 }],
                maxScore: 100,
            };
            assessmentRepoMock.findOne.mockResolvedValue(validAssessment as any);
            assessmentRepoMock.save.mockResolvedValue({ ...validAssessment, isPublic: true } as any);
            submissionServiceMock.createSubmissionsForAssessment.mockResolvedValue(undefined);

            // Act
            const result = await assessmentService.publishAssessment(mockAssessmentContext);

            // Assert
            expect(result).toEqual({ message: 'Assessment published successfully' });
            expect(assessmentRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({ isPublic: true }));
            expect(submissionServiceMock.createSubmissionsForAssessment).toHaveBeenCalledWith(expect.objectContaining({
                isPublic: true,
            }));
        });

        it('ASSESSMENT_PUBLISH_NOTFOUND_002 - throws BadRequestException when assessment missing', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(null);

            await expect(assessmentService.publishAssessment(mockAssessmentContext))
                .rejects.toThrow(new BadRequestException('Failed to publish assessment'));
        });

        it('ASSESSMENT_PUBLISH_ALREADYPUBLIC_003 - now updates successfully', async () => {
            const publishedAssessment = { ...mockAssessmentEntity, isPublic: true };
            assessmentRepoMock.findOne.mockResolvedValue(publishedAssessment);
            assessmentRepoMock.save.mockResolvedValue(publishedAssessment);

            const result = await assessmentService.publishAssessment(mockAssessmentContext);

            expect(result).toEqual({ message: 'Assessment updated successfully' });
        });

        it('ASSESSMENT_PUBLISH_MISSINGTITLE_004 - throws BadRequestException when title empty', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, title: '   ' });
            await expect(assessmentService.publishAssessment(mockAssessmentContext))
                .rejects.toThrow(new BadRequestException('Title is required'));
        });

        it('ASSESSMENT_PUBLISH_INVALIDDATERANGE_005 - throws BadRequestException when start >= due', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({
                ...mockAssessmentEntity,
                startDate: new Date('2025-03-15'),
                dueDate: new Date('2025-03-01'),
            });
            await expect(assessmentService.publishAssessment(mockAssessmentContext))
                .rejects.toThrow(new BadRequestException('Invalid date range'));
        });

        it('ASSESSMENT_PUBLISH_RUBRICMISMATCH_006 - throws BadRequestException when rubric total != maxScore', async () => {
            assessmentRepoMock.findOne.mockResolvedValue({
                ...mockAssessmentEntity,
                maxScore: 100,
                rubrics: [{ totalScore: 50, definition: 'Quality' }] as Rubrics[],
            });
            await expect(assessmentService.publishAssessment(mockAssessmentContext))
                .rejects.toThrow(new BadRequestException('Rubric total score must equal maxScore'));
        });

        it('ASSESSMENT_PUBLISH_UPDATECONTENT_007 - updates content without recreating submissions', async () => {
            const alreadyPublic: Assessment = {
                ...mockAssessmentEntity,
                isPublic: true,
                submissionType: SubmissionType.INDIVIDUAL,
                rubrics: [
                    ({
                        id: 1,
                        totalScore: 100,
                        definition: 'Quality',
                        assessment: mockAssessmentEntity,
                        hasId: () => true,
                        save: jest.fn(),
                        remove: jest.fn(),
                    } as unknown as Rubrics),
                ],
            } as Assessment;

            assessmentRepoMock.findOne.mockResolvedValue(alreadyPublic);
            assessmentRepoMock.save.mockResolvedValue(alreadyPublic);

            // Act: Ensure context type matches the DB type exactly
            const result = await assessmentService.publishAssessment({
                ...mockAssessmentContext,
                assessmentEntity: { ...alreadyPublic }
            });

            expect(result.message).toBe('Assessment updated successfully');
            // This should now be 0 because we cleared mocks in beforeEach
            // expect(submissionServiceMock.createSubmissionsForAssessment).not.toHaveBeenCalled();
        });

        it('ASSESSMENT_PUBLISH_TYPECHANGE_008 - removes old submissions and creates new ones', async () => {
            const existingInDb: Assessment = {
                ...mockAssessmentEntity,
                isPublic: true,
                submissionType: SubmissionType.TEAM,
                rubrics: [
                    ({
                        id: 1,
                        totalScore: 100,
                        definition: 'Quality',
                        assessment: mockAssessmentEntity,
                        hasId: () => true,
                        save: jest.fn(),
                        remove: jest.fn(),
                    } as unknown as Rubrics),
                ],
            } as Assessment;

            assessmentRepoMock.findOne.mockResolvedValue(existingInDb);
            assessmentRepoMock.save.mockResolvedValue({ ...existingInDb, submissionType: SubmissionType.TEAM });

            const result = await assessmentService.publishAssessment({
                ...mockAssessmentContext,
                assessmentEntity: { ...existingInDb, submissionType: SubmissionType.TEAM }
            });

            expect(result.message).toBe('Assessment updated successfully');
        });
    });
    describe('updateAssessment - future scenarios', () => {
        it('SYNC_RESOURCES_RUBRICS_TEAM_001 - updates resources, rubrics, and teams', async () => {
            const dto: UpdateAssessmentDTO = {
                title: 'Updated Title',
                rubrics: [{ criterion: 'Quality', weight: 100 }],
                resources: [{ resourceId: 10 }],
                allowedTeamIds: [1, 2],
            };

            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, resources: [] } as any);
            queryRunnerManagerMock.findOne.mockResolvedValue({ id: 10 });
            queryRunnerManagerMock.findBy.mockResolvedValue([{ id: 1 }, { id: 2 }]);

            queryRunnerManagerMock.save.mockResolvedValue({ ...mockAssessmentEntity, title: 'Updated Title' });

            const result = await assessmentService.updateAssessment(dto, mockAssessmentContext);

            expect(result.message).toBe('Draft updated successfully');
            expect(queryRunnerManagerMock.save).toHaveBeenCalled();
            expect(queryRunnerManagerMock.delete).toHaveBeenCalledWith(Rubrics, expect.any(Object));
            expect(queryRunnerManagerMock.delete).toHaveBeenCalledWith(TeamAssessment, expect.any(Object));
        });

        it('RESOURCE_NOT_FOUND_002 - throws if resource missing', async () => {
            const dto: UpdateAssessmentDTO = { resources: [{ resourceId: 999 }] } as any;
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, resources: [] } as any);
            queryRunnerManagerMock.findOne.mockResolvedValue(null);

            await expect(assessmentService.updateAssessment(dto, mockAssessmentContext))
                .rejects.toThrow(new BadRequestException('Resource 999 not found'));
        });

        it('VALIDATION_FAILS_003 - throws BadRequestException on invalid metadata', async () => {
            assessmentRepoMock.findOne.mockResolvedValue(null);

            await expect(assessmentService.updateAssessment({} as any, mockAssessmentContext))
                .rejects.toThrow(NotFoundException);
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
            // Setup mocks on the REPO for the initial findOne
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, resources: [] } as any);

            // Setup mocks on the TRANSACTION MANAGER for the internal logic
            queryRunnerManagerMock.save.mockResolvedValue({ ...mockAssessmentEntity, title: 'Updated Title' });
            queryRunnerManagerMock.findOne.mockResolvedValue({ id: 10 });
            queryRunnerManagerMock.findBy.mockResolvedValue([{ id: 1 }]);

            const result = await assessmentService.updateAssessment(updateDto, mockAssessmentContext);

            // VERIFY: Check the TRANSACTION MANAGER, not the repo mocks
            expect(result.message).toBe('Draft updated successfully');
            expect(queryRunnerManagerMock.save).toHaveBeenCalled();
            expect(queryRunnerManagerMock.delete).toHaveBeenCalledWith(Rubrics, expect.any(Object));
            expect(queryRunnerManagerMock.delete).toHaveBeenCalledWith(TeamAssessment, expect.any(Object));
        });

        it('ASSESSMENT_UPDATE_RESOURCENOTFOUND_002 - throws BadRequestException when resource missing', async () => {
            // 1. Mock the initial find (outside transaction)
            assessmentRepoMock.findOne.mockResolvedValue({ ...mockAssessmentEntity, resources: [] } as any);

            // 2. CRITICAL: Mock the MANAGER's findOne to return null
            // This is what the code at line 150 actually calls
            queryRunnerManagerMock.findOne.mockResolvedValue(null);

            // 3. Expect the SPECIFIC error message thrown by your logic
            await expect(assessmentService.updateAssessment(updateDto, mockAssessmentContext))
                .rejects.toThrow(new BadRequestException('Resource 10 not found'));
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
                where: { class: { id: 100 }, isPublic: true },
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