import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

// Entities
import { Assessment } from '../../libs/entities/assessment/assessment.entity';
import { Resource } from '../../libs/entities/resource/resource.entity';
import { AssessmentResource } from '../../libs/entities/resource/assessment-resource.entity';
import { Class } from '../../libs/entities/classroom/class.entity';
import { Enrollment } from '../../libs/entities/classroom/enrollment.entity';
import { Rubrics } from '../../libs/entities/assessment/rubic.entity';
import { Submission } from '../../libs/entities/assessment/submission.entity';

// Enums & DTOs
import { UpdateAssessmentDTO } from '../../libs/dtos/assessment/update-assessment.dto';
import { SubmissionMethod, SubmissionType } from '../../libs/enums/Assessment';
import { SubmissionService } from './submission.service';
import { Team } from '../../libs/entities/classroom/team.entity';
import { TeamAssessment } from '../../libs/entities/classroom/team-assessment.entity';

// Services
@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepo: Repository<Assessment>,
    @InjectRepository(Resource)
    private resourceRepo: Repository<Resource>,
    @InjectRepository(AssessmentResource)
    private assessResRepo: Repository<AssessmentResource>,
    @InjectRepository(Class)
    private classRepo: Repository<Class>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Rubrics)
    private rubricsRepo: Repository<Rubrics>,
    @InjectRepository(Submission)
    private submissionRepo: Repository<Submission>,
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,

    @InjectRepository(TeamAssessment)
    private teamAssessmentRepo: Repository<TeamAssessment>,

    private readonly submissionService: SubmissionService
  ) { }

  async createDraft(userId: number, classId: number, session: number) {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
      relations: ['owner'],
    });

    if (!classEntity) throw new NotFoundException('Class not found');
    if (classEntity.owner.id !== userId) throw new BadRequestException('Unauthorized');

    const assessment = await this.assessmentRepo.save({
      title: 'Untitled Assignment',
      instruction: '',
      maxScore: 0,
      submissionType: SubmissionType.INDIVIDUAL,
      allowLate: false,
      session: session,
      allowTeamSubmition: false,
      startDate: new Date(),
      dueDate: new Date(),
      isPublic: false,
      class: classEntity,
      aiEvaluationEnable: false,
      allowedSubmissionMethod: SubmissionMethod.ANY,
    });

    return { message: 'Draft created', assessmentId: assessment.id };
  }

  async publishAssessment(assessmentId: number, userId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class', 'class.owner', 'rubrics'],
    });

    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.class.owner.id !== userId) throw new BadRequestException('Unauthorized');
    if (assessment.isPublic) throw new BadRequestException('Assessment already published');

    if (!assessment.title?.trim()) throw new BadRequestException('Title is required');
    if (!assessment.instruction?.trim()) throw new BadRequestException('Instruction is required');
    if (!assessment.maxScore || assessment.maxScore <= 0) throw new BadRequestException('Max score must be greater than 0');
    if (!assessment.startDate || !assessment.dueDate) throw new BadRequestException('Dates are required');
    if (assessment.startDate >= assessment.dueDate) throw new BadRequestException('Invalid date range');

    const totalRubricScore = assessment.rubrics.reduce((sum, r) => sum + r.totalScore, 0);
    if (totalRubricScore !== assessment.maxScore) throw new BadRequestException('Rubric total score must equal maxScore');

    assessment.isPublic = true;
    await this.assessmentRepo.save(assessment);

    await this.submissionService.createSubmissionsForAssessment(assessment);

    return { message: 'Assessment published successfully' };
  }

  async updateAssessment(userId: number, assessmentId: number, dto: UpdateAssessmentDTO) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class', 'class.owner', 'resources', 'resources.resource'],
    });

    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.class.owner.id !== userId) throw new BadRequestException('Unauthorized');

    const { resources, rubrics, ...metadata } = dto;
    Object.assign(assessment, metadata);

    await this.assessmentRepo.save(assessment);

    if (resources?.length) {
      for (const r of resources) {
        const resource = await this.resourceRepo.findOne({ where: { id: r.resourceId } });
        if (!resource) throw new BadRequestException(`Resource ${r.resourceId} not found`);

        const exists = assessment.resources?.some((ar) => ar.resource.id === r.resourceId);
        if (!exists) {
          const ar = this.assessResRepo.create({ assessment, resource });
          await this.assessResRepo.save(ar);
          assessment.resources.push(ar);
        }
      }
    }

    if (rubrics) {
      await this.rubricsRepo.delete({ assessment: { id: assessmentId } });
      for (const rubricDto of rubrics) {
        await this.rubricsRepo.save({
          definition: rubricDto.criterion,
          totalScore: rubricDto.weight,
          assessment,
        });
      }
    }

    if (dto.allowedTeamIds?.length) {
      // Remove old teamAssessments
      await this.teamAssessmentRepo.delete({ assessment: { id: assessmentId } });

      // Add new teamAssessments
      const teams = await this.teamRepo.findBy({ id: In(dto.allowedTeamIds) });

      const newTeamAssessments = teams.map(team => this.teamAssessmentRepo.create({
        team,
        assessment,
      }));

      await this.teamAssessmentRepo.save(newTeamAssessments);
    }

    return {
      message: 'Draft updated successfully',
      assessment: { ...assessment, resources: assessment.resources?.map(ar => ar.resource) || [] },
    };
  }

  async getTracking(assessmentId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class'],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    if (!assessment.isPublic) throw new BadRequestException('Assessment not public')
    
    const submissions = await this.submissionRepo.find({
      where: { assessment: { id: assessmentId } },
      relations: ['user', 'team', 'evaluation'],
    });

    // Strategy A: Team Tracking
    if (assessment.submissionType==SubmissionType.TEAM) {
      const teams = await this.teamRepo.find({
        where: { class: { id: assessment.class.id } },
      });

      return teams.map((team) => {
        const sub = submissions.find((s) => s.team?.id === team.id);
        return {
          teamId: team.id,
          name: team.name,
          status: sub
            ? sub.evaluation
              ? 'GRADED'
              : sub.status
            : 'NOT_SUBMITTED',
          score: sub?.evaluation?.score || null,
        };
      });
    }

    // Strategy B: Individual Tracking
    else {
      const enrollments = await this.enrollmentRepo.find({
        where: { class: { id: assessment.class.id } },
        relations: ['user'],
      });

      return enrollments.map((enrollment) => {
        const sub = submissions.find((s) => s.user?.id === enrollment.user.id);
        return {
          studentId: enrollment.user.id,
          name: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
          status: sub
            ? sub.evaluation
              ? 'GRADED'
              : sub.status
            : 'NOT_SUBMITTED',
          score: sub?.evaluation?.score || null,
        };
      });
    }
  }

  async findAllByClass(classId: number) {
    return await this.assessmentRepo.find({
      where: { class: { id: classId } },
      order: { dueDate: 'ASC' },
      relations: ['resources', 'resources.resource'],
    });
  }

  async findAllByClassSession(classId: number, sessionId: number) {
    return await this.assessmentRepo.find({
      where: { class: { id: classId }, session: sessionId },
      order: { dueDate: 'ASC' },
      relations: ['resources', 'resources.resource'],
    });
  }

  async findOne(assessmentId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['resources', 'resources.resource', 'class'],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async deleteAssessment(userId: number, assessmentId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class', 'class.owner'],
    });

    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.class.owner.id !== userId) throw new BadRequestException('Unauthorized');

    return await this.assessmentRepo.remove(assessment);
  }
}