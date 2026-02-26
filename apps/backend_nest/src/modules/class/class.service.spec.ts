import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Repository } from 'typeorm';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ClassService } from './class.service';
import { Class } from '../../libs/entities/classroom/class.entity';
import { User } from '../../libs/entities/user/user.entity';
import { Enrollment } from '../../libs/entities/classroom/enrollment.entity';
import { Submission } from '../../libs/entities/assessment/submission.entity';

import { CreateClassDto } from '../../libs/dtos/class/create-class.dto';
import { UpdateClassDto } from '../../libs/dtos/class/update-class.dto';
import { ClassResponseDto } from '../../libs/dtos/class/class-response.dto';
import { JoinClassResponseDto } from '../../libs/dtos/class/join-class-response.dto';
import { MessageResponseDto } from '../../libs/dtos/common/message-response.dto';
import { LeaderboardItemDto } from '../../libs/dtos/class/leaderboard-response.dto';
import { InviteLinkResponseDto } from '../../libs/dtos/class/invite-link-response.dto';

import { UserRole } from '../../libs/enums/Role';
import { ClassStatus } from '../../libs/enums/Status';
import * as GenerateUtils from '../../libs/utils/GenerateRandom';
import type { ClassContext } from '../../common/security';
import { mock } from 'node:test';

describe('ClassService', () => {
    let classService: ClassService;
    let classRepoMock: jest.Mocked<Repository<Class>>;
    let userRepoMock: jest.Mocked<Repository<User>>;
    let enrollmentRepoMock: jest.Mocked<Repository<Enrollment>>;
    let submissionRepoMock: jest.Mocked<Repository<Submission>>;
    let mailerMock: jest.Mocked<MailerService>;
    let configMock: jest.Mocked<ConfigService>;
    let jwtMock: jest.Mocked<JwtService>;
    let generateJoinCodeSpy: ReturnType<typeof jest.spyOn>;;

    const mockOwner: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
    } as User;

    const mockClassEntity: Class = {
        id: 100,
        name: 'Advanced NestJS',
        description: 'Learn NestJS deeply',
        coverImageUrl: 'https://example.com/cover.jpg',
        status: ClassStatus.ACTIVE,
        owner: mockOwner,
        joinCode: 'TEST12',
    } as Class;

    const mockEnrollmentTeacher: Enrollment = {
        id: 200,
        user: mockOwner,
        class: mockClassEntity,
        role: UserRole.Teacher,
    } as Enrollment;

    const mockStudent: User = {
        id: 2,
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
    } as User;

    const mockStudentEnrollment: Enrollment = {
        id: 201,
        user: mockStudent,
        class: mockClassEntity,
        role: UserRole.Student,
    } as Enrollment;

    const mockClassContextTeacher: ClassContext = {
        classId: 100,
        userId: 1,
        role: UserRole.Teacher,
        isOwner: true,
        classEntity: mockClassEntity,
        enrollment: mockEnrollmentTeacher,
    };

    const mockClassContextStudent: ClassContext = {
        classId: 100,
        userId: 2,
        role: UserRole.Student,
        isOwner: false,
        classEntity: mockClassEntity,
        enrollment: mockStudentEnrollment,
    };

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClassService,
                {
                    provide: getRepositoryToken(Class),
                    useValue: {
                        findOneBy: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        remove: jest.fn(),
                        manager: {
                            count: jest.fn(),
                            transaction: jest.fn(),
                        },
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOneBy: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Enrollment),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        remove: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Submission),
                    useValue: {
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: MailerService,
                    useValue: {
                        sendMail: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        verifyAsync: jest.fn(),
                        signAsync: jest.fn(),
                    },
                },
            ],
        }).compile();

        classService = module.get<ClassService>(ClassService);
        classRepoMock = module.get(getRepositoryToken(Class)) as jest.Mocked<Repository<Class>>;
        userRepoMock = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
        enrollmentRepoMock = module.get(getRepositoryToken(Enrollment)) as jest.Mocked<Repository<Enrollment>>;
        submissionRepoMock = module.get(getRepositoryToken(Submission)) as jest.Mocked<Repository<Submission>>;
        mailerMock = module.get(MailerService) as jest.Mocked<MailerService>;
        configMock = module.get(ConfigService) as jest.Mocked<ConfigService>;
        jwtMock = module.get(JwtService) as jest.Mocked<JwtService>;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        generateJoinCodeSpy = jest.spyOn(GenerateUtils, 'generateJoinCode').mockReturnValue('TEST12');
        configMock.get.mockImplementation((key: string) => {
            if (key === 'JWT_INVITE_SECRET') return 'invite-secret';
            if (key === 'BASE_URL') return 'https://example.com';
            return undefined;
        });
    });

    describe('createClass', () => {
        const validDto: CreateClassDto = { name: 'New Class', description: 'Test' };

        it('CLASS_CREATECLASS_VALID_001 - creates class, generates unique join code, creates teacher enrollment, returns DTO', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockOwner);
            classRepoMock.findOneBy.mockResolvedValue(null); // no duplicate code
            classRepoMock.create.mockReturnValue(mockClassEntity);
            classRepoMock.save.mockResolvedValue(mockClassEntity);
            enrollmentRepoMock.create.mockReturnValue(mockEnrollmentTeacher);
            enrollmentRepoMock.save.mockResolvedValue(mockEnrollmentTeacher);

            const result = await classService.createClass(validDto, 1);

            expect(result).toEqual({
                id: 100,
                name: 'Advanced NestJS',
                description: 'Learn NestJS deeply',
                coverImageUrl: 'https://example.com/cover.jpg',
                status: ClassStatus.ACTIVE,
                owner: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                role: UserRole.Teacher,
                joinCode: 'TEST12',
            });
            expect(generateJoinCodeSpy).toHaveBeenCalled();
            expect(classRepoMock.findOneBy).toHaveBeenCalledWith({ joinCode: 'TEST12' });
            expect(enrollmentRepoMock.create).toHaveBeenCalledWith({
                user: mockOwner,
                class: mockClassEntity,
                role: UserRole.Teacher,
            });
        });

        it('CLASS_CREATECLASS_NOOWNER_002 - throws NotFoundException when owner not found', async () => {
            userRepoMock.findOneBy.mockResolvedValue(null);

            await expect(classService.createClass(validDto, 999)).rejects.toThrow(
                new NotFoundException('User not found')
            );
        });

        it('CLASS_CREATECLASS_CODEFAIL_003 - throws BadRequestException after 10 failed join code attempts', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockOwner);
            classRepoMock.findOneBy.mockResolvedValue({} as any); // always exists

            await expect(classService.createClass(validDto, 1)).rejects.toThrow(
                new BadRequestException('Failed to generate unique join code')
            );
            expect(classRepoMock.findOneBy).toHaveBeenCalledTimes(11);
        });

        it('CLASS_CREATECLASS_SAVEERROR_004 - propagates error from save (wrapped by TypeORM but test sees it)', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockOwner);
            classRepoMock.findOneBy.mockResolvedValue(null);
            classRepoMock.save.mockRejectedValue(new Error('DB error'));

            await expect(classService.createClass(validDto, 1)).rejects.toThrow();
        });
    });

    describe('joinClassWithCode', () => {
        it('CLASS_JOINWITHCODE_VALID_001 - finds class and calls enrollUserInClass', async () => {
            classRepoMock.findOneBy.mockResolvedValue(mockClassEntity);
            // enrollUserInClass will be exercised internally - we mock its dependencies
            userRepoMock.findOneBy.mockResolvedValue(mockStudent);
            enrollmentRepoMock.findOne.mockResolvedValue(null);
            enrollmentRepoMock.create.mockReturnValue(mockStudentEnrollment);
            enrollmentRepoMock.save.mockResolvedValue(mockStudentEnrollment);

            const result = await classService.joinClassWithCode('TEST12', 2);

            expect(result).toEqual({
                message: 'Successfully joined class',
                classId: 100,
            });
        });

        it('CLASS_JOINWITHCODE_NOTFOUND_002 - throws NotFoundException when class does not exist', async () => {
            classRepoMock.findOneBy.mockResolvedValue(null);

            await expect(classService.joinClassWithCode('INVALID', 2)).rejects.toThrow(
                new NotFoundException('Class not found with this code')
            );
        });
    });

    describe('removeStudent', () => {
        it('CLASS_REMOVESTUDENT_VALID_001 - removes student successfully', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue(mockStudentEnrollment);

            const result = await classService.removeStudent(2, mockClassContextTeacher);

            expect(result).toEqual({ message: 'Student removed successfully' });
            expect(enrollmentRepoMock.remove).toHaveBeenCalledWith(mockStudentEnrollment);
        });

        it('CLASS_REMOVESTUDENT_SELF_002 - throws BadRequestException when removing self', async () => {
            await expect(classService.removeStudent(1, mockClassContextTeacher)).rejects.toThrow(
                new BadRequestException('You cannot remove yourself')
            );
        });

        it('CLASS_REMOVESTUDENT_INVALIDID_003 - throws BadRequestException for invalid studentId', async () => {
            await expect(classService.removeStudent(0, mockClassContextTeacher)).rejects.toThrow(
                new BadRequestException('Invalid student ID')
            );
        });

        it('CLASS_REMOVESTUDENT_NOTFOUND_004 - throws NotFoundException when student not enrolled', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue(null);

            await expect(classService.removeStudent(999, mockClassContextTeacher)).rejects.toThrow(
                new NotFoundException('Student not found in this class')
            );
        });

        it('CLASS_REMOVESTUDENT_TEACHER_005 - throws ForbiddenException when trying to remove teacher', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue({ ...mockStudentEnrollment, role: UserRole.Teacher } as any);

            await expect(classService.removeStudent(3, mockClassContextTeacher)).rejects.toThrow(
                new ForbiddenException('Cannot remove another teacher')
            );
        });
    });

    describe('updateClass', () => {
        const updateDto: UpdateClassDto = { name: 'Updated Name', coverImageUrl: 'new-cover.jpg' };

        it('CLASS_UPDATECLASS_VALID_001 - updates fields and returns DTO', async () => {
            // Use a plain object for updatedEntity to avoid missing entity methods
            const updatedEntity = {
                id: 100,
                name: 'Updated Name',
                description: 'Learn NestJS deeply',
                coverImageUrl: 'new-cover.jpg',
                status: ClassStatus.ACTIVE,
                owner: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                joinCode: 'TEST12',
            };
            classRepoMock.save.mockResolvedValue(updatedEntity as any);

            const result = await classService.updateClass(updateDto, mockClassContextTeacher);

            expect(result).toEqual({
                id: 100,
                name: 'Updated Name',
                description: 'Learn NestJS deeply',
                coverImageUrl: 'new-cover.jpg',
                status: ClassStatus.ACTIVE,
                owner: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                role: UserRole.Teacher,
                joinCode: 'TEST12',
            });
        });

        it('CLASS_UPDATECLASS_NOCONTEXT_002 - throws NotFoundException when no classEntity', async () => {
            const badContext = { ...mockClassContextTeacher, classEntity: undefined } as any;
            await expect(classService.updateClass(updateDto, badContext)).rejects.toThrow(
                new NotFoundException('Class context not available')
            );
        });
    });

    describe('deleteClass', () => {
        it('CLASS_DELETECLASS_VALID_001 - deletes when no dependencies', async () => {
            classRepoMock.manager.count.mockResolvedValue(0);
            enrollmentRepoMock.count.mockResolvedValue(1); // only teacher
            classRepoMock.remove.mockResolvedValue(undefined as any);

            const result = await classService.deleteClass(mockClassContextTeacher);

            expect(result).toEqual({ message: 'Class deleted successfully' });
        });

        it('CLASS_DELETECLASS_HASDEPS_002 - throws BadRequestException when dependencies exist', async () => {
            classRepoMock.manager.count.mockResolvedValueOnce(1); // assessment > 0

            await expect(classService.deleteClass(mockClassContextTeacher)).rejects.toThrow(
                new BadRequestException('Class cannot be deleted due to existing dependencies (assessments, submissions, enrollments, etc.)')
            );
        });

        it('CLASS_DELETECLASS_FKERROR_003 - throws BadRequestException on foreign key violation', async () => {
            classRepoMock.manager.count.mockResolvedValue(0);
            enrollmentRepoMock.count.mockResolvedValue(1);
            classRepoMock.remove.mockRejectedValue({ code: '23503' } as any);

            await expect(classService.deleteClass(mockClassContextTeacher)).rejects.toThrow(
                new BadRequestException('Class cannot be deleted due to existing dependencies (assessments, submissions, etc.)')
            );
        });

        it('CLASS_DELETECLASS_NOCONTEXT_004 - throws NotFoundException when no classEntity', async () => {
            const badContext = { ...mockClassContextTeacher, classEntity: undefined } as any;
            await expect(classService.deleteClass(badContext)).rejects.toThrow(
                new NotFoundException('Class context not available')
            );
        });
    });

    describe('getClassesForUser', () => {
        it('CLASS_GETCLASSESFORUSER_VALID_001 - returns unique owned + enrolled classes', async () => {
            classRepoMock.find.mockResolvedValue([mockClassEntity]);
            enrollmentRepoMock.find.mockResolvedValue([mockStudentEnrollment]);

            const result = await classService.getClassesForUser(1);

            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        owner: expect.objectContaining({
                            id: mockOwner.id,
                            firstName: mockOwner.firstName,
                            lastName: mockOwner.lastName,
                            email: mockOwner.email,
                        }),
                    }),
                ]),
            );
        });

        it('CLASS_GETCLASSESFORUSER_EMPTY_002 - returns empty array when none', async () => {
            classRepoMock.find.mockResolvedValue([]);
            enrollmentRepoMock.find.mockResolvedValue([]);

            const result = await classService.getClassesForUser(999);
            expect(result).toEqual([]);
        });
    });

    describe('getStudentsInClass', () => {
        it('CLASS_GETSTUDENTS_VALID_001 - returns student DTOs', async () => {
            enrollmentRepoMock.find.mockResolvedValue([mockStudentEnrollment]);

            const result = await classService.getStudentsInClass(mockClassContextTeacher);

            expect(result).toEqual([{
                id: 2,
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'alice@example.com',
            }]);
        });

        it('CLASS_GETSTUDENTS_NOCONTEXT_002 - throws NotFoundException', async () => {
            // Simulate missing classEntity and ensure repo mock returns undefined
            const badContext = { ...mockClassContextTeacher, classEntity: undefined } as any;
            // Remove mock for enrollmentRepoMock.find to avoid interfering with NotFoundException
            await expect(classService.getStudentsInClass(badContext)).rejects.toThrow(
                new NotFoundException('Class context not available')
            );
        });
    });

    describe('transferOwnership', () => {
        it('CLASS_TRANSFEROWNERSHIP_VALID_001 - transfers ownership via transaction', async () => {
            const newOwnerEnroll = { ...mockStudentEnrollment, role: UserRole.Student, user: mockStudent } as any;
            enrollmentRepoMock.findOne.mockResolvedValue(newOwnerEnroll);

            const transactionalManager = { save: jest.fn().mockResolvedValue(undefined) };
            classRepoMock.manager.transaction.mockImplementation(async (cb: any) => cb(transactionalManager));

            const result = await classService.transferOwnership(2, mockClassContextTeacher);

            expect(result).toEqual({ message: 'Ownership transferred successfully' });
            expect(transactionalManager.save).toHaveBeenCalled();
        });

        it('CLASS_TRANSFEROWNERSHIP_SELF_002 - throws BadRequestException', async () => {
            await expect(classService.transferOwnership(1, mockClassContextTeacher)).rejects.toThrow(
                new BadRequestException('Cannot transfer ownership to yourself')
            );
        });

        it('CLASS_TRANSFEROWNERSHIP_NOTENROLLED_003 - throws NotFoundException', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue(null);

            await expect(classService.transferOwnership(999, mockClassContextTeacher)).rejects.toThrow(
                new NotFoundException('New owner must be enrolled in this class')
            );
        });
    });

    describe('assignTA', () => {
        it('CLASS_ASSIGNTA_VALID_001 - assigns TA role', async () => {
            const taEnroll = { ...mockStudentEnrollment, role: UserRole.Student } as any;
            enrollmentRepoMock.findOne.mockResolvedValue(taEnroll);
            userRepoMock.findOneBy.mockResolvedValue(mockStudent);

            const result = await classService.assignTA(2, mockClassContextTeacher);

            expect(result).toEqual({ message: 'User 2 assigned as TA for class 100.' });
            expect(enrollmentRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.TeacherAssistant }));
        });

        it('CLASS_ASSIGNTA_NOTENROLLED_002 - throws NotFoundException', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue(null);
            userRepoMock.findOneBy.mockResolvedValue(mockStudent);

            await expect(classService.assignTA(2, mockClassContextTeacher)).rejects.toThrow(
                new NotFoundException('User must be enrolled in the class before being assigned as TA')
            );
        });

        it('CLASS_ASSIGNTA_ALREADYTEACHER_003 - throws ForbiddenException', async () => {
            const teacherEnroll = { ...mockStudentEnrollment, role: UserRole.Teacher } as any;
            enrollmentRepoMock.findOne.mockResolvedValue(teacherEnroll);

            await expect(classService.assignTA(2, mockClassContextTeacher)).rejects.toThrow(
                new ForbiddenException('Cannot demote a teacher to TA')
            );
        });
    });

    describe('markClassComplete', () => {
        it('CLASS_MARKCOMPLETE_VALID_001 - sets status to END', async () => {
            // Use a plain object to avoid missing entity methods error
            const completedClass = {
                id: mockClassEntity.id,
                name: mockClassEntity.name,
                description: mockClassEntity.description,
                coverImageUrl: mockClassEntity.coverImageUrl,
                status: ClassStatus.END,
                owner: mockClassEntity.owner,
                joinCode: mockClassEntity.joinCode,
            };
            classRepoMock.save.mockResolvedValue(completedClass as any);

            await classService.markClassComplete(mockClassContextTeacher);

            expect(classRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({ status: ClassStatus.END }));
        });

        it('CLASS_MARKCOMPLETE_NOCONTEXT_002 - throws NotFoundException', async () => {
            const badContext = { ...mockClassContextTeacher, classEntity: undefined } as any;
            await expect(classService.markClassComplete(badContext)).rejects.toThrow(
                new NotFoundException('Class context not available')
            );
        });
    });

    describe('getLeaderboard', () => {
        it('CLASS_GETLEADERBOARD_VALID_001 - returns sorted scores', async () => {
            enrollmentRepoMock.find.mockResolvedValue([mockStudentEnrollment]);
            const mockQB = {
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([{ userId: 2, totalScore: 850 }]),
            };
            submissionRepoMock.createQueryBuilder.mockReturnValue(mockQB as any);

            const result = await classService.getLeaderboard(mockClassContextTeacher);

            expect(result).toEqual([{
                user: { id: 2, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
                totalScore: 850,
            }]);
        });

        it('CLASS_GETLEADERBOARD_QUERYERROR_002 - throws BadRequestException on query failure', async () => {
            const mockQB = { ...{}, getRawMany: jest.fn().mockRejectedValue(new Error('query fail')) };
            submissionRepoMock.createQueryBuilder.mockReturnValue(mockQB as any);

            await expect(classService.getLeaderboard(mockClassContextTeacher)).rejects.toThrow(
                new BadRequestException('Failed to calculate leaderboard. Please check class assessment/submission schema.')
            );
        });
    });

    describe('inviteByEmail', () => {
        it('CLASS_INVITEBYEMAIL_VALID_001 - sends email with invite link', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockStudent);
            enrollmentRepoMock.findOne.mockResolvedValue(null); // not enrolled
            jwtMock.signAsync.mockResolvedValue('jwt-token-123');
            mailerMock.sendMail.mockResolvedValue(undefined as any);

            const result = await classService.inviteByEmail('alice@example.com', mockClassContextTeacher);

            expect(result).toEqual({ message: 'Invite sent to alice@example.com' });
            expect(mailerMock.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'alice@example.com',
                    subject: `You're invited to join ${mockClassContextTeacher.classEntity.name}!`,
                }),
            );
        });

        it('CLASS_INVITEBYEMAIL_USERNOTFOUND_002 - throws NotFoundException', async () => {
            userRepoMock.findOneBy.mockResolvedValue(null);
            enrollmentRepoMock.findOne.mockResolvedValue(null);

            await expect(classService.inviteByEmail('unknown@example.com', mockClassContextTeacher)).rejects.toThrow(
                new NotFoundException('User with this email not found. They must register first.')
            );
        });
    });

    describe('joinClassByInviteToken', () => {
        it('CLASS_JOINBYTOKEN_VALID_001 - joins successfully', async () => {
            jwtMock.verifyAsync.mockResolvedValue({ classId: 100, userId: 3 });
            classRepoMock.findOne.mockResolvedValue(mockClassEntity);
            enrollmentRepoMock.findOne.mockResolvedValue(null);
            enrollmentRepoMock.create.mockReturnValue(mockStudentEnrollment);
            enrollmentRepoMock.save.mockResolvedValue(mockStudentEnrollment);

            const result = await classService.joinClassByInviteToken('valid-token', 3);

            expect(result).toEqual({ message: 'Successfully joined the class', classId: 100 });
        });

        it('CLASS_JOINBYTOKEN_INVALIDTOKEN_002 - throws BadRequestException', async () => {
            jwtMock.verifyAsync.mockRejectedValue(new Error('invalid'));

            await expect(classService.joinClassByInviteToken('bad', 2)).rejects.toThrow(
                new BadRequestException('Invalid or expired invite link')
            );
        });
    });

    describe('findClassAndVerifyMember', () => {
        it('CLASS_FINDANDVERIFY_ENROLLED_001 - returns context when enrolled', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue(mockStudentEnrollment as any);

            const result = await classService.findClassAndVerifyMember(100, 2);

            expect(result).toEqual({ class: mockClassEntity, enrollment: mockStudentEnrollment });
        });

        it('CLASS_FINDANDVERIFY_OWNER_002 - returns context when owner (no enrollment)', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue(null);
            classRepoMock.findOne.mockResolvedValue(mockClassEntity);

            const result = await classService.findClassAndVerifyMember(100, 1);

            expect(result).toEqual({ class: mockClassEntity, enrollment: null });
        });

        it('CLASS_FINDANDVERIFY_NOTAUTHORIZED_003 - throws NotFoundException', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue(null);
            classRepoMock.findOne.mockResolvedValue(null);

            await expect(classService.findClassAndVerifyMember(100, 999)).rejects.toThrow(
                new NotFoundException('Class with ID 100 not found, or you are not authorized to view this data.')
            );
        });
    });

    describe('generateInviteLink', () => {
        it('CLASS_GENERATEINVITELINK_VALID_001 - returns link with signed token', async () => {
            jwtMock.signAsync.mockResolvedValue('signed-token-xyz');

            const result = await classService.generateInviteLink(100, 2);

            expect(result).toEqual({
                link: 'https://example.com/class/join/link?token=signed-token-xyz',
            });
            expect(jwtMock.signAsync).toHaveBeenCalledWith(
                { classId: 100, userId: 2 },
                expect.objectContaining({ secret: 'invite-secret', expiresIn: '7d' })
            );
        });
    });
});