import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Repository } from 'typeorm';
import {
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { TeamService } from './team.service';
import { Team } from '../../libs/entities/classroom/team.entity';
import { User } from '../../libs/entities/user/user.entity';
import { Enrollment } from '../../libs/entities/classroom/enrollment.entity';
import { TeamMember } from '../../libs/entities/classroom/user-team.entity';

import { CreateTeamDto } from '../../libs/dtos/team/create-team.dto';
import { CreateManyTeamsDto } from '../../libs/dtos/team/create-many-teams.dto';

import { UserRole } from '../../libs/enums/Role';
import * as GenerateUtils from '../../libs/utils/GenerateRandom';
import type { TeamContext, ClassContext } from '../../common/security/dtos/guard.dto';

describe('TeamService', () => {
    let teamService: TeamService;
    let teamRepoMock: jest.Mocked<Repository<Team>>;
    let userRepoMock: jest.Mocked<Repository<User>>;
    let enrollmentRepoMock: jest.Mocked<Repository<Enrollment>>;
    let teamMemberRepoMock: jest.Mocked<Repository<TeamMember>>;
    let mailerMock: jest.Mocked<MailerService>;
    let configMock: jest.Mocked<ConfigService>;
    let jwtMock: jest.Mocked<JwtService>;
    let generateJoinCodeSpy: ReturnType<typeof jest.spyOn>;
    
    const mockUserLeader: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        profilePictureUrl: 'https://example.com/john.jpg',
    } as User;

    const mockUserLeader2: User = {
        id: 2,
        firstName: 'John2',
        lastName: 'Do2e',
        email: 'john@exa2mple.com',
        profilePictureUrl: 'https:/2/example.com/john.jpg',
    } as User;

    const mockUserStudent: User = {
        id: 2,
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        profilePictureUrl: null,
    } as User;

    const mockTeamEntity: Team = {
        id: 200,
        name: 'Team Alpha',
        joinCode: 'T1E2A3',
        maxMember: 5,
        leader: mockUserLeader,
        class: { id: 100, name: 'Math 101' } as any,
    } as Team;

    const mockTeamMember: TeamMember = {
        id: 300,
        user: mockUserStudent,
        team: mockTeamEntity,
    } as TeamMember;

    const mockTeamContextLeader: TeamContext = {
        teamId: 200,
        userId: 1,
        isLeader: true,
        isMember: true,
        isApproved: true,
        teamEntity: mockTeamEntity,
        membership: undefined,
    };

    const mockTeamContextMember: TeamContext = {
        teamId: 200,
        userId: 2,
        isLeader: false,
        isMember: true,
        isApproved: true,
        teamEntity: mockTeamEntity,
        membership: mockTeamMember,
    };

    const mockClassContext: ClassContext = {
        classId: 100,
        userId: 1,
        role: UserRole.Teacher,
        isOwner: true,
        classEntity: { id: 100 } as any,
    };

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TeamService,
                {
                    provide: getRepositoryToken(Team),
                    useValue: {
                        findOne: jest.fn(),
                        findOneBy: jest.fn(),
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOneBy: jest.fn(),
                        findByIds: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Enrollment),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(TeamMember),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        remove: jest.fn(),
                        count: jest.fn(),
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
                        signAsync: jest.fn(),
                        verifyAsync: jest.fn(),
                    },
                },
            ],
        }).compile();

        teamService = module.get<TeamService>(TeamService);
        teamRepoMock = module.get(getRepositoryToken(Team)) as jest.Mocked<Repository<Team>>;
        userRepoMock = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
        enrollmentRepoMock = module.get(getRepositoryToken(Enrollment)) as jest.Mocked<Repository<Enrollment>>;
        teamMemberRepoMock = module.get(getRepositoryToken(TeamMember)) as jest.Mocked<Repository<TeamMember>>;
        mailerMock = module.get(MailerService) as jest.Mocked<MailerService>;
        configMock = module.get(ConfigService) as jest.Mocked<ConfigService>;
        jwtMock = module.get(JwtService) as jest.Mocked<JwtService>;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        generateJoinCodeSpy = jest.spyOn(GenerateUtils, 'generateJoinCode').mockReturnValue('T1E2A3');
        configMock.get.mockImplementation((key: string) => {
            if (key === 'TEAM_INVITE_SECRET') return 'team-secret';
            if (key === 'BASE_URL') return 'https://example.com';
            return undefined;
        });
    });

    describe('createTeam', () => {
        const validDto: CreateTeamDto = { name: 'Team Alpha', maxMember: 5, classId: 100 };

        it('TEAM_CREATETEAM_VALID_001 - creates team with unique join code, adds leader as member, returns DTO', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockUserLeader);
            enrollmentRepoMock.findOne.mockResolvedValue({ class: { id: 100 } } as any);
            teamRepoMock.findOneBy.mockResolvedValue(null);
            teamRepoMock.create.mockReturnValue(mockTeamEntity);
            teamRepoMock.save.mockResolvedValue(mockTeamEntity);
            teamMemberRepoMock.create.mockReturnValue(mockTeamMember);
            teamMemberRepoMock.save.mockResolvedValue(mockTeamMember);

            const result = await teamService.createTeam(validDto, 1);

            expect(result).toEqual({
                id: 200,
                name: 'Team Alpha',
                joinCode: 'T1E2A3',
                maxMember: 5,
                leader: {
                    id: 1,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    profilePictureUrl: 'https://example.com/john.jpg',
                },
                members: undefined,
            });
            expect(generateJoinCodeSpy).toHaveBeenCalled();
            expect(teamMemberRepoMock.create).toHaveBeenCalledWith({ user: mockUserLeader, team: mockTeamEntity });
        });

        it('TEAM_CREATETEAM_USERNOTFOUND_002 - throws NotFoundException when user not found', async () => {
            userRepoMock.findOneBy.mockResolvedValue(null);

            await expect(teamService.createTeam(validDto, 999)).rejects.toThrow(
                new NotFoundException('User not found')
            );
        });

        it('TEAM_CREATETEAM_NOTENROLLED_003 - throws ForbiddenException when not enrolled in class', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockUserLeader);
            enrollmentRepoMock.findOne.mockResolvedValue(null);

            await expect(teamService.createTeam(validDto, 1)).rejects.toThrow(
                new ForbiddenException('You must be enrolled in this class to join a team')
            );
        });

        it('TEAM_CREATETEAM_SAVEERROR_004 - throws Error when team save fails', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockUserLeader);
            enrollmentRepoMock.findOne.mockResolvedValue({ class: { id: 100 } } as any);
            teamRepoMock.findOneBy.mockResolvedValue(null);
            teamRepoMock.save.mockRejectedValue(new Error('DB fail'));

            await expect(teamService.createTeam(validDto, 1)).rejects.toThrow('Failed to create team');
        });
    });

    describe('joinTeamWithCode', () => {
        it('TEAM_JOINWITHCODE_VALID_001 - joins existing team with leader', async () => {
            teamRepoMock.findOne.mockResolvedValue(mockTeamEntity);
            userRepoMock.findOneBy.mockResolvedValue(mockUserStudent);
            teamMemberRepoMock.findOne.mockResolvedValue(null);
            teamMemberRepoMock.count.mockResolvedValue(2);
            teamMemberRepoMock.create.mockReturnValue(mockTeamMember);
            teamMemberRepoMock.save.mockResolvedValue(mockTeamMember);

            const result = await teamService.joinTeamWithCode('T1E2A3', 2);

            expect(result).toEqual({ message: 'Successfully joined team', teamId: 200 });
        });

        it('TEAM_JOINWITHCODE_NOTFOUND_002 - throws NotFoundException when team not found', async () => {
            teamRepoMock.findOne.mockResolvedValue(null);

            await expect(teamService.joinTeamWithCode('INVALID', 2)).rejects.toThrow(
                new NotFoundException('Team not found with this code')
            );
        });

        it('TEAM_JOINWITHCODE_SETLEADER_003 - sets leader if missing and then joins', async () => {
            const teamNoLeader = { ...mockTeamEntity, leader: undefined } as Partial<Team>;
            teamRepoMock.findOne.mockResolvedValue(teamNoLeader as Team);
            userRepoMock.findOneBy.mockResolvedValue(mockUserStudent);
            // Use a plain object for mock return value to match DeepPartial<Team> & Team
            teamRepoMock.save.mockResolvedValue({
                id: teamNoLeader.id,
                name: teamNoLeader.name,
                joinCode: teamNoLeader.joinCode,
                maxMember: teamNoLeader.maxMember,
                class: teamNoLeader.class,
                leader: mockUserStudent,
            } as any);
            teamMemberRepoMock.findOne.mockResolvedValue(null);
            teamMemberRepoMock.count.mockResolvedValue(0);
            teamMemberRepoMock.create.mockReturnValue(mockTeamMember);
            teamMemberRepoMock.save.mockResolvedValue(mockTeamMember);

            const result = await teamService.joinTeamWithCode('T1E2A3', 2);

            expect(result).toEqual({ message: 'Successfully joined team', teamId: 200 });
            expect(teamRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({ leader: mockUserStudent }));
        });
    });

    describe('createManyTeams', () => {
        const validManyDto: CreateManyTeamsDto = {
            classId: 100,
            teams: [
                { name: 'Team A', maxMember: 4, leaderId: 1 },
                { name: 'Team B', maxMember: 3, memberIds: [2] ,leaderId: 2},
            ],
        };

        it('TEAM_CREATEMANY_VALID_001 - creates multiple teams with leaders and members', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue({ class: { id: 100, name: 'Math' } } as any);
            teamRepoMock.findOneBy.mockResolvedValue(null);
            userRepoMock.findOneBy.mockResolvedValue(mockUserLeader);
            userRepoMock.findByIds.mockResolvedValue([mockUserStudent]);
            enrollmentRepoMock.findOne.mockResolvedValue({} as any); // student enrolled
            teamRepoMock.create.mockReturnValue(mockTeamEntity);
            teamRepoMock.save.mockResolvedValue(mockTeamEntity);
            teamMemberRepoMock.create.mockReturnValue(mockTeamMember);
            teamMemberRepoMock.save.mockResolvedValue(mockTeamMember);

            const result = await teamService.createManyTeams(validManyDto, 1);

            expect(result.message).toBe('2 teams created successfully.');
            expect(result.teams.length).toBe(2);
        });

        it('TEAM_CREATEMANY_NOTTEACHER_002 - throws ForbiddenException when not teacher', async () => {
            enrollmentRepoMock.findOne.mockResolvedValue(null);

            await expect(teamService.createManyTeams(validManyDto, 2)).rejects.toThrow(
                new ForbiddenException('You are not a teacher of this class or class does not exist')
            );
        });

        it('TEAM_CREATEMANY_MISSINGLEADER_003 - throws BadRequestException when members provided without leaderId', async () => {
            const badDto: CreateManyTeamsDto = {
                classId: 100,
                teams: [{ name: 'Bad Team', maxMember: 4, memberIds: [2] }],
            };

            enrollmentRepoMock.findOne.mockResolvedValue({} as any);

            await expect(teamService.createManyTeams(badDto, 1)).rejects.toThrow(
                new BadRequestException('leaderId is required for team "Bad Team" because members are provided.')
            );
        });
    });

    describe('getAllTeamsInClass', () => {
        it('TEAM_GETALLTEAMS_VALID_001 - returns ordered teams for user in class', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockUserLeader);
            enrollmentRepoMock.findOne.mockResolvedValue({} as any);
            teamRepoMock.find.mockResolvedValue([mockTeamEntity]);

            const result = await teamService.getAllTeamsInClass(100, 1);

            expect(result).toEqual([{
                id: 200,
                name: 'Team Alpha',
                joinCode: 'T1E2A3',
                maxMember: 5,
                leader: {
                    id: 1,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    profilePictureUrl: 'https://example.com/john.jpg',
                },
                members: undefined,
            }]);
        });

        it('TEAM_GETALLTEAMS_NOTENROLLED_002 - throws ForbiddenException', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockUserLeader);
            enrollmentRepoMock.findOne.mockResolvedValue(null);

            await expect(teamService.getAllTeamsInClass(100, 1)).rejects.toThrow(
                new ForbiddenException('You must be enrolled in this class to join a team')
            );
        });
    });

    describe('getTeamDetails', () => {
        it('TEAM_GETDETAILS_VALID_001 - returns full team with members', async () => {
            const fullTeam = {
                ...mockTeamEntity,
                members: [mockTeamMember],
            };
            teamRepoMock.findOne.mockResolvedValue(fullTeam as any);

            const result = await teamService.getTeamDetails(mockTeamContextLeader);

            expect(result).toEqual({
                id: 200,
                name: 'Team Alpha',
                joinCode: 'T1E2A3',
                maxMember: 5,
                leader: {
                    id: 1,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    profilePictureUrl: 'https://example.com/john.jpg',
                },
                members: [{
                    id: 2,
                    firstName: 'Alice',
                    lastName: 'Smith',
                    email: 'alice@example.com',
                    profilePictureUrl: null,
                }],
            });
        });

        it('TEAM_GETDETAILS_NOTFOUND_002 - throws NotFoundException', async () => {
            teamRepoMock.findOne.mockResolvedValue(null);

            await expect(teamService.getTeamDetails(mockTeamContextLeader)).rejects.toThrow(
                new NotFoundException('Team not found')
            );
        });
    });

    describe('getTeamsWithMembersInClass', () => {
        it('TEAM_GETWITHMEMBERS_VALID_001 - returns all teams with members for class', async () => {
            const fullTeam = { ...mockTeamEntity, members: [mockTeamMember] };
            teamRepoMock.find.mockResolvedValue([fullTeam as any]);

            const result = await teamService.getTeamsWithMembersInClass(mockClassContext);

            expect(result).toEqual([{
                id: 200,
                name: 'Team Alpha',
                joinCode: 'T1E2A3',
                maxMember: 5,
                leader: {
                    id: 1,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    profilePictureUrl: 'https://example.com/john.jpg',
                },
                members: [{
                    id: 2,
                    firstName: 'Alice',
                    lastName: 'Smith',
                    email: 'alice@example.com',
                    profilePictureUrl: null,
                }],
            }]);
        });
    });

    describe('leaveTeam', () => {
        it('TEAM_LEAVETEAM_VALID_001 - removes membership when not leader', async () => {
            teamMemberRepoMock.remove.mockResolvedValue(undefined as any);

            const result = await teamService.leaveTeam(mockTeamContextMember);

            expect(result).toEqual({ message: 'You have successfully left the team' });
            expect(teamMemberRepoMock.remove).toHaveBeenCalledWith(mockTeamMember);
        });

        it('TEAM_LEAVETEAM_LEADER_002 - throws ForbiddenException for leader', async () => {
            await expect(teamService.leaveTeam(mockTeamContextLeader)).rejects.toThrow(
                new ForbiddenException('Leader cannot leave the team. Transfer leadership first.')
            );
        });

        it('TEAM_LEAVETEAM_NOTMEMBER_003 - throws NotFoundException', async () => {
            const noMemberContext = { ...mockTeamContextMember, membership: undefined };
            await expect(teamService.leaveTeam(noMemberContext as any)).rejects.toThrow(
                new NotFoundException('You are not in this team')
            );
        });
    });

    describe('removeMember', () => {
        it('TEAM_REMOVEMEMBER_VALID_001 - removes member successfully', async () => {
            teamMemberRepoMock.findOne.mockResolvedValue(mockTeamMember);
            teamMemberRepoMock.remove.mockResolvedValue(undefined as any);

            const result = await teamService.removeMember(2, mockTeamContextLeader);

            expect(result).toEqual({ message: 'Team member removed successfully' });
        });

        it('TEAM_REMOVEMEMBER_SELF_002 - throws BadRequestException when removing self', async () => {
            await expect(teamService.removeMember(1, mockTeamContextLeader)).rejects.toThrow(
                new BadRequestException('The leader cannot be removed')
            );
        });

        it('TEAM_REMOVEMEMBER_NOTFOUND_003 - throws NotFoundException', async () => {
            teamMemberRepoMock.findOne.mockResolvedValue(null);

            await expect(teamService.removeMember(999, mockTeamContextLeader)).rejects.toThrow(
                new NotFoundException('Team member not found')
            );
        });
    });

    describe('generateInviteLink', () => {
        it('TEAM_GENERATEINVITELINK_VALID_001 - returns signed link', async () => {
            jwtMock.signAsync.mockResolvedValue('jwt-team-token');

            const result = await teamService.generateInviteLink(2, mockTeamContextLeader);

            expect(result).toEqual({
                link: 'https://example.com/team/join/link?token=jwt-team-token',
            });
        });
    });

    describe('inviteByEmail', () => {
        it('TEAM_INVITEBYEMAIL_VALID_001 - sends email successfully', async () => {
            userRepoMock.findOneBy.mockResolvedValue(mockUserStudent);
            enrollmentRepoMock.findOne.mockResolvedValue({} as any);
            teamMemberRepoMock.findOne.mockResolvedValue(null);
            jwtMock.signAsync.mockResolvedValue('jwt-token');
            mailerMock.sendMail.mockResolvedValue(undefined as any);

            const result = await teamService.inviteByEmail('alice@example.com', mockTeamContextLeader);

            expect(result).toEqual({ message: 'Invite sent to alice@example.com' });
            expect(mailerMock.sendMail).toHaveBeenCalled();
        });

        it('TEAM_INVITEBYEMAIL_USERNOTFOUND_002 - throws NotFoundException', async () => {
            userRepoMock.findOneBy.mockResolvedValue(null);

            await expect(teamService.inviteByEmail('unknown@example.com', mockTeamContextLeader)).rejects.toThrow(
                new NotFoundException('User with this email not found')
            );
        });
    });

    describe('joinTeamWithLink', () => {
        it('TEAM_JOINWITHLINK_VALID_001 - joins via valid token', async () => {
            jwtMock.verifyAsync.mockResolvedValue({ teamId: 200, memberId: 2 });
            teamRepoMock.findOne.mockResolvedValue(mockTeamEntity);
            userRepoMock.findOneBy.mockResolvedValue(mockUserStudent);
            enrollmentRepoMock.findOne.mockResolvedValue({} as any);
            teamMemberRepoMock.findOne.mockResolvedValue(null);
            teamMemberRepoMock.count.mockResolvedValue(2);
            teamMemberRepoMock.create.mockReturnValue(mockTeamMember);
            teamMemberRepoMock.save.mockResolvedValue(mockTeamMember);

            const result = await teamService.joinTeamWithLink('valid-token', 2);

            expect(result).toEqual({ message: 'Successfully joined team', teamId: 200 });
        });

        it('TEAM_JOINWITHLINK_INVALIDTOKEN_002 - throws BadRequestException', async () => {
            jwtMock.verifyAsync.mockRejectedValue(new Error('bad token'));

            await expect(teamService.joinTeamWithLink('bad', 2)).rejects.toThrow(
                new BadRequestException('Invalid or expired invite link')
            );
        });

        it('TEAM_JOINWITHLINK_WRONGUSER_003 - throws UnauthorizedException', async () => {
            jwtMock.verifyAsync.mockResolvedValue({ teamId: 200, memberId: 5 });

            await expect(teamService.joinTeamWithLink('token', 2)).rejects.toThrow(
                new UnauthorizedException('You Are not invited.')
            );
        });
    });
});