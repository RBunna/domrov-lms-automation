import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

// Entities
import { Assessment } from '../../libs/entities/assessment/assessment.entity';
import { Resource } from '../../libs/entities/resource/resource.entity';
import { AssessmentResource } from '../../libs/entities/resource/assessment-resource.entity';
import { Enrollment } from '../../libs/entities/classroom/enrollment.entity';
import { Rubrics } from '../../libs/entities/assessment/rubic.entity';
import { Submission } from '../../libs/entities/assessment/submission.entity';

// Enums & DTOs
import { UpdateAssessmentDTO } from '../../libs/dtos/assessment/update-assessment.dto';
import { SubmissionMethod, SubmissionType } from '../../libs/enums/Assessment';
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
import { SubmissionService } from './submission.service';
import { Team } from '../../libs/entities/classroom/team.entity';
import { TeamAssessment } from '../../libs/entities/classroom/team-assessment.entity';
import type { AssessmentContext, ClassContext } from '../../common/security/dtos/guard.dto';

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

  async createDraft(session: number, context: ClassContext): Promise<CreateDraftResponseDto> {
    try {
      if (!context?.classEntity) throw new NotFoundException('Class context not available');
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
        class: context.classEntity,
        aiEvaluationEnable: false,
        allowedSubmissionMethod: SubmissionMethod.ANY,
      });
      return { message: 'Draft created', assessmentId: assessment.id };
    } catch (err) {
      throw new BadRequestException('Failed to create draft');
    }
  }

  async publishAssessment(context: AssessmentContext): Promise<PublishAssessmentResponseDto> {
    try {
      const assessment = await this.assessmentRepo.findOne({
        where: { id: context.assessmentId },
        relations: ['class', 'rubrics'],
      });
      if (!assessment) throw new NotFoundException('Assessment not found');
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
    } catch (err) {
      throw new BadRequestException('Failed to publish assessment');
    }
  }

  async updateAssessment(dto: UpdateAssessmentDTO, context: AssessmentContext): Promise<UpdateAssessmentResponseDto> {
    try {
      const assessment = await this.assessmentRepo.findOne({
        where: { id: context.assessmentId },
        relations: ['class', 'resources', 'resources.resource'],
      });
      if (!assessment) throw new NotFoundException('Assessment not found');
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
        await this.rubricsRepo.delete({ assessment: { id: context.assessmentId } });
        for (const rubricDto of rubrics) {
          await this.rubricsRepo.save({
            definition: rubricDto.criterion,
            totalScore: rubricDto.weight,
            assessment,
          });
        }
      }
      if (dto.allowedTeamIds?.length) {
        await this.teamAssessmentRepo.delete({ assessment: { id: context.assessmentId } });
        const teams = await this.teamRepo.findBy({ id: In(dto.allowedTeamIds) });
        const newTeamAssessments = teams.map(team => this.teamAssessmentRepo.create({
          team,
          assessment,
        }));
        await this.teamAssessmentRepo.save(newTeamAssessments);
      }
      return {
        message: 'Draft updated successfully',
        assessment: { ...assessment, resources: assessment.resources || [] },
      };
    } catch (err) {
      throw new BadRequestException('Failed to update assessment');
    }
  }

  async getTracking(context: AssessmentContext): Promise<TeamTrackingItemDto[] | IndividualTrackingItemDto[]> {
    try {
      const assessment = await this.assessmentRepo.findOne({
        where: { id: context.assessmentId },
        relations: ['class'],
      });
      if (!assessment) throw new NotFoundException('Assessment not found');
      if (!assessment.isPublic) throw new BadRequestException('Assessment is not published yet');
      const submissions = await this.submissionRepo.find({
        where: { assessment: { id: context.assessmentId } },
        relations: ['user', 'team', 'evaluation'],
      });
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
      } else {
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
    } catch (err) {
      throw new BadRequestException('Failed to get tracking');
    }
  }

  async findAllByClass(context: ClassContext): Promise<AssessmentListItemDto[]> {
    try {
      if (!context?.classId) throw new NotFoundException('Class context not available');
      return await this.assessmentRepo.find({
        where: { class: { id: context.classId } },
        order: { dueDate: 'ASC' },
        relations: ['resources', 'resources.resource'],
      });
    } catch (err) {
      throw new BadRequestException('Failed to get assessments for class');
    }
  }

  async findAllByClassSession(sessionId: number, context: ClassContext): Promise<AssessmentListItemDto[]> {
    try {
      if (!context?.classId) throw new NotFoundException('Class context not available');
      return await this.assessmentRepo.find({
        where: { class: { id: context.classId }, session: sessionId },
        order: { dueDate: 'ASC' },
        relations: ['resources', 'resources.resource'],
      });
    } catch (err) {
      throw new BadRequestException('Failed to get assessments for class session');
    }
  }

  async findOne(context: AssessmentContext): Promise<AssessmentDetailDto> {
    try {
      const assessment = await this.assessmentRepo.findOne({
        where: { id: context.assessmentId },
        relations: ['resources', 'resources.resource', 'rubrics'],
      });
      if (!assessment) throw new NotFoundException('Assessment not found');
      return assessment;
    } catch (err) {
      throw new BadRequestException('Failed to get assessment details');
    }
  }

  async deleteAssessment(context: AssessmentContext): Promise<DeleteAssessmentResponseDto> {
    try {
      if (!context?.assessmentEntity) throw new NotFoundException('Assessment context not available');
      return await this.assessmentRepo.remove(context.assessmentEntity);
    } catch (err) {
      throw new BadRequestException('Failed to delete assessment');
    }
  }
}