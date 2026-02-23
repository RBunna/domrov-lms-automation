import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../libs/entities/classroom/class.entity';
import { Enrollment } from '../../libs/entities/classroom/enrollment.entity';
import { User } from '../../libs/entities/user/user.entity';
import { CreateClassDto } from '../../libs/dtos/class/create-class.dto';
import { generateJoinCode } from '../../libs/utils/GenerateRandom';
import { UserRole } from '../../libs/enums/Role';
import { TransferOwnershipDto } from '../../libs/dtos/class/transfer-ownership.dto';
import { AssignTADto } from '../../libs/dtos/class/assign-ta.dto';
import { ClassStatus } from '../../libs/enums/Status';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UpdateClassDto } from '../../libs/dtos/class/update-class.dto';
import { Submission } from '../../libs/entities/assessment/submission.entity';
import { UserResponseDto } from '../../libs/dtos/user/user-response.dto';
import { ClassResponseDto } from '../../libs/dtos/class/class-response.dto';
import { JoinClassResponseDto } from '../../libs/dtos/class/join-class-response.dto';
import { MessageResponseDto } from '../../libs/dtos/common/message-response.dto';
import { LeaderboardItemDto } from '../../libs/dtos/class/leaderboard-response.dto';
import { InviteLinkResponseDto } from '../../libs/dtos/class/invite-link-response.dto';
@Injectable()
export class ClassService {
    constructor(
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Enrollment)
        private readonly enrollmentRepository: Repository<Enrollment>,
        @InjectRepository(Submission)
        private readonly submissionRepository: Repository<Submission>,
        private readonly mailerService: MailerService,
        private config: ConfigService,
        private jwtService: JwtService,
    ) { }

    async createClass(createClassDto: CreateClassDto, ownerId: number): Promise<ClassResponseDto> {
        const owner = await this.userRepository.findOneBy({ id: ownerId });
        if (!owner) throw new NotFoundException('User not found');

        let joinCode: string;
        let codeExists: boolean;
        do {
            joinCode = generateJoinCode();
            codeExists = !!(await this.classRepository.findOneBy({ joinCode }));
        } while (codeExists);

        const newClass = this.classRepository.create({
            ...createClassDto,
            owner,
            joinCode,
        });

        const savedClass = await this.classRepository.save(newClass);

        const enrollment = this.enrollmentRepository.create({
            user: owner,
            class: savedClass,
            role: UserRole.Teacher,
        });
        await this.enrollmentRepository.save(enrollment);

        return ClassResponseDto.fromEntity(savedClass, UserRole.Teacher);
    }

    async joinClassWithCode(joinCode: string, studentId: number) {
        const classToJoin = await this.classRepository.findOneBy({ joinCode });
        if (!classToJoin) {
            throw new NotFoundException('Class not found with this code');
        }

        return this.enrollUserInClass(classToJoin.id, studentId);
    }

    async removeStudent(
        classId: number,
        studentId: number,
        teacherId: number,
    ): Promise<MessageResponseDto> {
        await this.findClassAndVerifyTeacher(classId, teacherId);

        if (studentId === teacherId) {
            throw new BadRequestException('You cannot remove yourself');
        }

        const enrollment = await this.enrollmentRepository.findOne({
            where: { class: { id: classId }, user: { id: studentId } },
        });

        if (!enrollment) {
            throw new NotFoundException('Student not found in this class');
        }

        if (enrollment.role === UserRole.Teacher) {
            throw new ForbiddenException('Cannot remove another teacher');
        }

        await this.enrollmentRepository.remove(enrollment);
        return { message: 'Student removed successfully' };
    }

    async updateClass(
        classId: number,
        teacherId: number,
        dto: UpdateClassDto,
    ): Promise<ClassResponseDto> {
        const { class: classEntity } =
            await this.findClassAndVerifyTeacher(classId, teacherId);

        if (dto.name !== undefined) classEntity.name = dto.name;
        if (dto.description !== undefined)
            classEntity.description = dto.description;
        if (dto.coverImageUrl !== undefined)
            classEntity.coverImageUrl = dto.coverImageUrl;

        const saved = await this.classRepository.save(classEntity);
        return ClassResponseDto.fromEntity(saved, UserRole.Teacher);
    }

    async deleteClass(
        classId: number,
        teacherId: number,
    ): Promise<MessageResponseDto> {
        const { class: classEntity } =
            await this.findClassAndVerifyTeacher(classId, teacherId);

        if (classEntity.owner?.id !== teacherId) {
            throw new ForbiddenException(
                'Only the class owner can delete this class',
            );
        }

        try {
            await this.classRepository.remove(classEntity);
        } catch {
            throw new BadRequestException(
                'Class cannot be deleted due to existing dependencies',
            );
        }

        return { message: 'Class deleted successfully' };
    }

    private async enrollUserInClass(
        classId: number,
        studentId: number,
    ): Promise<JoinClassResponseDto> {
        const student = await this.userRepository.findOneBy({ id: studentId });
        if (!student) throw new NotFoundException('User not found');

        const classToJoin = await this.classRepository.findOneBy({ id: classId });
        if (!classToJoin) throw new NotFoundException('Class not found');

        const existingEnrollment = await this.isUserEnrolled(
            classId,
            studentId,
        );
        if (existingEnrollment) {
            throw new ConflictException(
                'User is already enrolled in this class',
            );
        }

        const enrollment = this.enrollmentRepository.create({
            user: student,
            class: classToJoin,
            role: UserRole.Student,
        });

        await this.enrollmentRepository.save(enrollment);
        return { message: 'Successfully joined class', classId };
    }

    async getClassesForUser(userId: number): Promise<ClassResponseDto[]> {
        const ownedClasses = await this.classRepository.find({
            where: { owner: { id: userId } },
            relations: ['owner'],
        });

        const enrollments = await this.enrollmentRepository.find({
            where: { user: { id: userId } },
            relations: ['class', 'class.owner'],
        });

        const mappedOwned = ownedClasses.map((cls) =>
            ClassResponseDto.fromEntity(cls, UserRole.Teacher),
        );

        const mappedEnrolled = enrollments.map((enrollment) =>
            ClassResponseDto.fromEntity(
                enrollment.class,
                enrollment.role,
            ),
        );

        const combinedClasses = [...mappedOwned, ...mappedEnrolled];
        const uniqueClasses = Array.from(
            new Map(combinedClasses.map((cls) => [cls.id, cls])).values(),
        );

        return uniqueClasses;
    }

    async getStudentsInClass(classId: number, userId: number) {
        await this.findClassAndVerifyMember(classId, userId);

        const enrollments = await this.enrollmentRepository.find({
            where: { class: { id: classId }, role: UserRole.Student },
            relations: ['user'],
        });

        return enrollments.map((e) =>
            UserResponseDto.toDto(e.user),
        );
    }


    async transferOwnership(
        transferOwnershipDto: TransferOwnershipDto,
        currentOwnerId: number,
    ): Promise<MessageResponseDto> {
        const { classId, newOwnerId } = transferOwnershipDto;

        const classToTransfer = await this.classRepository.findOne({
            where: { id: classId },
            relations: ['owner'],
        });
        if (!classToTransfer) throw new NotFoundException('Class not found');
        if (classToTransfer.owner.id !== currentOwnerId)
            throw new ForbiddenException(
                'Only the current owner can transfer ownership',
            );

        const newOwnerEnrollment =
            await this.enrollmentRepository.findOne({
                where: {
                    class: { id: classId },
                    user: { id: newOwnerId },
                },
                relations: ['user'],
            });
        if (!newOwnerEnrollment)
            throw new NotFoundException(
                'New owner must be enrolled in this class',
            );

        const currentOwnerEnrollment =
            await this.enrollmentRepository.findOne({
                where: {
                    class: { id: classId },
                    user: { id: currentOwnerId },
                },
            });
        if (!currentOwnerEnrollment)
            throw new NotFoundException(
                'Current owner enrollment not found',
            );

        newOwnerEnrollment.role = UserRole.Teacher;
        currentOwnerEnrollment.role = UserRole.TeacherAssistant;

        await this.enrollmentRepository.save([
            newOwnerEnrollment,
            currentOwnerEnrollment,
        ]);

        classToTransfer.owner = newOwnerEnrollment.user;
        await this.classRepository.save(classToTransfer);

        return { message: 'Ownership transferred successfully' };
    }

    async assignTA(
        dto: AssignTADto,
        teacherId: number,
    ): Promise<MessageResponseDto> {
        const { classId, taId } = dto;

        const teacherEnrollment =
            await this.enrollmentRepository.findOne({
                where: {
                    user: { id: teacherId },
                    class: { id: classId },
                    role: UserRole.Teacher,
                },
                relations: ['class'],
            });

        if (!teacherEnrollment) {
            throw new ForbiddenException(
                'You are not a teacher of this class.',
            );
        }

        const classEntity = teacherEnrollment.class;

        const taUser = await this.userRepository.findOneBy({ id: taId });
        if (!taUser) throw new NotFoundException('TA user not found.');

        const existingEnrollment =
            await this.enrollmentRepository.findOne({
                where: { user: { id: taId }, class: { id: classId } },
            });

        if (existingEnrollment) {
            existingEnrollment.role = UserRole.TeacherAssistant;
            await this.enrollmentRepository.save(existingEnrollment);
        } else {
            const newTAEnrollment = this.enrollmentRepository.create({
                user: taUser,
                class: classEntity,
                role: UserRole.TeacherAssistant,
            });
            await this.enrollmentRepository.save(newTAEnrollment);
        }

        return {
            message: `User ${taId} assigned as TA for class ${classId}.`,
        };
    }

    async markClassComplete(
        classId: number,
        teacherId: number,
    ): Promise<MessageResponseDto> {
        const teacherEnrollment =
            await this.enrollmentRepository.findOne({
                where: {
                    user: { id: teacherId },
                    class: { id: classId },
                    role: UserRole.Teacher,
                },
                relations: ['class'],
            });

        if (!teacherEnrollment) {
            throw new ForbiddenException(
                'You are not the teacher of this class.',
            );
        }

        const classEntity = teacherEnrollment.class;
        classEntity.status = ClassStatus.END;
        await this.classRepository.save(classEntity);

        return {
            message: `Class "${classEntity.name}" marked as completed.`,
        };
    }

    async getLeaderboard(
        classId: number,
        teacherId: number,
    ): Promise<LeaderboardItemDto[]> {
        await this.findClassAndVerifyTeacher(classId, teacherId);

        const students = await this.enrollmentRepository.find({
            where: { class: { id: classId }, role: UserRole.Student },
            relations: ['user'],
        });

        const rawScores = await this.submissionRepository
            .createQueryBuilder('submission')
            .leftJoin('submission.evaluation', 'evaluation')
            .leftJoin('submission.assessment', 'assessment')
            .where('assessment.classId = :classId', { classId })
            .andWhere('submission.userId IS NOT NULL')
            .select('submission.userId', 'userId')
            .addSelect('SUM(COALESCE(evaluation.score, 0))', 'totalScore')
            .groupBy('submission.userId')
            .getRawMany();

        const scoreMap = new Map<number, number>();
        rawScores.forEach((r: any) => {
            scoreMap.set(Number(r.userId), Number(r.totalScore || 0));
        });

        const leaderboard = students
            .map((en) => ({
                user: UserResponseDto.toDto(en.user),
                totalScore: scoreMap.get(en.user.id) || 0,
            }))
            .sort((a, b) => b.totalScore - a.totalScore);

        return leaderboard;
    }

    async inviteByEmail(
        classId: number,
        email: string,
        teacherId: number,
    ): Promise<MessageResponseDto> {
        const { class: classToJoin } =
            await this.findClassAndVerifyTeacher(classId, teacherId);

        const userToInvite = await this.userRepository.findOneBy({
            email,
        });
        if (!userToInvite) {
            throw new NotFoundException(
                'User with this email not found. They must register first.',
            );
        }

        const existingEnrollment = await this.isUserEnrolled(
            classToJoin.id,
            userToInvite.id,
        );
        if (existingEnrollment) {
            throw new ConflictException('User is already in this class');
        }

        const { link } = await this.generateInviteLink(
            classId,
            teacherId,
            userToInvite.id,
            true,
        );

        await this.mailerService.sendMail({
            to: userToInvite.email,
            subject: `You're invited to join ${classToJoin.name}!`,
            text: `Hello ${userToInvite.firstName + ' ' + userToInvite.lastName},\n\nYou have been invited to join the class "${classToJoin.name}".\nClick this link to join: ${link}\n\n.`,
            html: `<p>Hello ${userToInvite.firstName},</p>
             <p>You have been invited to join the class <b>${classToJoin.name}</b>.</p>
             <p>Click the link below to join:</p>
             <a href="${link}">${link}</a>`,
        });

        return { message: `Invite sent to ${email}` };
    }

    async joinClassByInviteToken(
        token: string,
        userId: number,
    ): Promise<JoinClassResponseDto> {
        let payload: any;

        try {
            payload = await this.jwtService.verifyAsync(token, {
                secret: this.config.get<string>('JWT_INVITE_SECRET'),
            });
        } catch {
            throw new BadRequestException(
                'Invalid or expired invite link',
            );
        }

        if (payload.userId == userId) {
            throw new UnauthorizedException(
                'You are not Invited to this class',
            );
        }

        const classId = payload.classId;

        const classToJoin = await this.classRepository.findOne({
            where: { id: classId },
            relations: ['owner'],
        });

        if (!classToJoin) {
            throw new NotFoundException('Class not found');
        }

        if (userId == classToJoin.owner.id) {
            throw new UnauthorizedException(
                'You are already the teacher in this class.',
            );
        }

        const existingEnrollment =
            await this.enrollmentRepository.findOne({
                where: { class: { id: classId }, user: { id: userId } },
            });

        if (existingEnrollment) {
            throw new ConflictException(
                'You are already enrolled in this class',
            );
        }

        const enrollment = this.enrollmentRepository.create({
            class: { id: classId },
            user: { id: userId },
            role: UserRole.Student,
        });

        await this.enrollmentRepository.save(enrollment);

        return {
            message: 'Successfully joined the class',
            classId,
        };
    }

    private async findClassAndVerifyTeacher(
        classId: number,
        teacherId: number,
    ) {
        // 1. Find the class directly to check ownership
        const classEntity = await this.classRepository.findOne({
            where: { id: classId },
            relations: ['owner'],
        });

        // 2. Check if user is the owner
        // Added optional chaining (?.) for safety
        if (classEntity && classEntity.owner?.id === teacherId) {
            return { class: classEntity };
        }

        // 3. If not owner, check for explicit Teacher enrollment
        const enrollment = await this.enrollmentRepository.findOne({
            where: {
                class: { id: classId },
                user: { id: teacherId },
                role: UserRole.Teacher, // Must be teacher
            },
            relations: ['class'],
        });

        if (!enrollment) {
            throw new NotFoundException('Class not found or you are not authorized');
        }

        return { class: enrollment.class, enrollment };
    }

    private async isUserEnrolled(
        classId: number,
        userId: number,
    ): Promise<Enrollment | null> {
        return this.enrollmentRepository.findOne({
            where: {
                class: { id: classId },
                user: { id: userId },
            },
        });
    }

    async findClassAndVerifyMember(
        classId: number,
        userId: number,
    ) {
        // 1. Check for explicit Enrollment (Student or Teacher)
        const enrollment = await this.enrollmentRepository.findOne({
            where: {
                class: { id: classId },
                user: { id: userId },
            },
            relations: ['class'],
        });

        // 2. If enrolled, authorize immediately
        if (enrollment) {
            return { class: enrollment.class, enrollment };
        }

        // 3. If not enrolled, check if user is the Class Owner
        const classEntity = await this.classRepository.findOne({
            where: { id: classId, owner: { id: userId } },
        });

        if (classEntity) {
            // Return only the class, enrollment is null
            return { class: classEntity, enrollment: null };
        }

        // 4. If neither enrolled nor owner, deny access
        throw new NotFoundException(
            `Class with ID ${classId} not found, or you are not authorized to view this data.`
        );
    }

    async generateInviteLink(
        classId: number,
        teacherId: number,
        userInvitedId: number,
        internalCall: boolean = false,
    ): Promise<InviteLinkResponseDto> {
        if (!internalCall) {
            await this.findClassAndVerifyTeacher(classId, teacherId);
        }

        const payload = { classId, userId: userInvitedId };

        const token = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_INVITE_SECRET'),
            expiresIn: '7d',
        });

        const baseUrl = this.config.get<string>('BASE_URL');

        return {
            link: `${baseUrl}/class/join/link?token=${token}`,
        };
    }

}