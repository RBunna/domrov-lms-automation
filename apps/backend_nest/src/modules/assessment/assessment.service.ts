import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

// Entities
import { Assessment } from '../../libs/entities/assessment/assessment.entity';
import { Submission } from '../../libs/entities/assessment/submission.entity';
import { Resource } from '../../libs/entities/resource/resource.entity';
import { AssessmentResource } from '../../libs/entities/resource/assessment-resource.entity';
import { Class } from '../../libs/entities/classroom/class.entity';
import { User } from '../../libs/entities/user/user.entity';
import { Team } from '../../libs/entities/classroom/team.entity';
import { Enrollment } from '../../libs/entities/classroom/enrollment.entity';
import { Rubrics } from '../../libs/entities/assessment/rubic.entity';
import { ConfigService } from '@nestjs/config';

// Enums & DTOs
import { SubmissionStatus } from '../../libs/enums/Status';
import { ResourceType } from '../../libs/enums/Resource';
import { CreateAssessmentDTO } from '../../libs/dtos/assessment/create-assessment.dto';
import { GradeSubmissionDTO } from '../../libs/dtos/submission/grade-submission.dto';
import { UpdateAssessmentDTO } from '../../libs/dtos/assessment/update-assessment.dto';
import { SubmissionResource } from '../../libs/entities/resource/submission-resource.entity';
import { Evaluation } from '../../libs/entities/assessment/evaluation.entity';
import { AIModelSelectionMode, EvaluationType, SubmissionMethod, SubmissionType } from '../../libs/enums/Assessment';
import { SubmitAssignmentDto } from '../../libs/dtos/submission/submit-assignment.dto';
import { EvaluationFeedback } from '../../libs/entities/assessment/evaluation-feedback.entity';
import { FeedbackItemDto } from '../../libs/dtos/submission/feedback-item.dto';
import { EvaluationService } from '../evaluation/evaluation.service';
import { Encryption } from '../../libs/utils/Encryption';
import { UserAIKey } from '../../libs/entities/ai/user-ai-key.entity';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepo: Repository<Assessment>,
    @InjectRepository(Submission)
    private submissionRepo: Repository<Submission>,
    @InjectRepository(Resource) private resourceRepo: Repository<Resource>,
    @InjectRepository(SubmissionResource)
    private subResourceRepo: Repository<SubmissionResource>,
    @InjectRepository(AssessmentResource)
    private assessResRepo: Repository<AssessmentResource>,
    @InjectRepository(Evaluation)
    private evaluationRepo: Repository<Evaluation>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Rubrics) private rubricsRepo: Repository<Rubrics>,
    @InjectRepository(EvaluationFeedback)
    private readonly evaluationFeedbackRepo: Repository<EvaluationFeedback>,

    @InjectRepository(UserAIKey)
    private readonly userAIKeyRepo: Repository<UserAIKey>,


    private readonly aiEvaluationService: EvaluationService
  ) { }

  async createDraft(userId: number, classId: number, session: number) {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
      relations: ['owner'],
    });

    if (!classEntity) throw new NotFoundException('Class not found');
    if (classEntity.owner.id !== userId)
      throw new BadRequestException('Unauthorized');

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

    return {
      message: 'Draft created',
      assessmentId: assessment.id,
    };
  }

  async publishAssessment(assessmentId: number, userId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class', 'class.owner', 'rubrics'],
    });

    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.class.owner.id !== userId)
      throw new BadRequestException('Unauthorized');

    // 🚨 prevent double publish
    if (assessment.isPublic) {
      throw new BadRequestException('Assessment already published');
    }

    // ===============================
    // 🔥 STRICT VALIDATION
    // ===============================

    if (!assessment.title?.trim())
      throw new BadRequestException('Title is required');

    if (!assessment.instruction?.trim())
      throw new BadRequestException('Instruction is required');

    if (!assessment.maxScore || assessment.maxScore <= 0)
      throw new BadRequestException('Max score must be greater than 0');

    if (!assessment.startDate || !assessment.dueDate)
      throw new BadRequestException('Dates are required');

    if (assessment.startDate >= assessment.dueDate)
      throw new BadRequestException('Invalid date range');

    // ✅ rubric validation
    const totalRubricScore = assessment.rubrics.reduce(
      (sum, r) => sum + r.totalScore,
      0,
    );

    if (totalRubricScore !== assessment.maxScore)
      throw new BadRequestException(
        'Rubric total score must equal maxScore',
      );

    // ===============================
    // 🔥 MARK PUBLIC
    // ===============================

    assessment.isPublic = true;
    await this.assessmentRepo.save(assessment);

    // ===============================
    // 🔥 CREATE SUBMISSIONS (ONLY NOW)
    // ===============================

    await this.createSubmissionsForAssessment(assessment);

    return {
      message: 'Assessment published successfully',
    };
  }

  async updateAssessment(
    userId: number,
    assessmentId: number,
    dto: UpdateAssessmentDTO,
  ) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: [
        'class',
        'class.owner',
        'resources',             // correct name from your entity
        'resources.resource',    // join the actual Resource entity
      ],
    });

    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.class.owner.id !== userId)
      throw new BadRequestException('Unauthorized');

    // // 🚨 CRITICAL VALIDATION: prevent editing published assessment
    // if (assessment.isPublic) {
    //   throw new BadRequestException(
    //     'Cannot edit assessment after it has been published.',
    //   );
    // }

    const { resources, rubrics, ...metadata } = dto;

    // ✅ update metadata freely (draft mode)
    Object.assign(assessment, metadata);

    // auto team flag
    if (dto.submissionType) {
      assessment.allowTeamSubmition =
        dto.submissionType === SubmissionType.TEAM;
    }

    await this.assessmentRepo.save(assessment);

    // -----------------------------
    // 🔥 RESOURCES (replace mode)
    // -----------------------------
    if (resources?.length) {
      for (const r of resources) {
        const resource = await this.resourceRepo.findOne({
          where: { id: r.resourceId },
        });
        if (!resource) {
          throw new BadRequestException(`Resource ${r.resourceId} not found`);
        }

        // Check if already linked
        const exists = assessment.resources?.some(
          (ar) => ar.resource.id === r.resourceId,
        );

        if (!exists) {
          const ar = this.assessResRepo.create({
            assessment,
            resource,
          });
          await this.assessResRepo.save(ar);
          assessment.resources.push(ar); // update local array
        }
      }
    }

    // -----------------------------
    // 🔥 RUBRICS (replace mode)
    // -----------------------------
    if (rubrics) {
      await this.rubricsRepo.delete({
        assessment: { id: assessmentId },
      });

      for (const rubricDto of rubrics) {
        await this.rubricsRepo.save({
          definition: rubricDto.criterion,
          totalScore: rubricDto.weight,
          assessment,
        });
      }
    }

    return {
      message: 'Draft updated successfully',
      assessment: {
        ...assessment,
        resources: assessment.resources?.map(ar => ar.resource) || [],
      },
    };
  }

  private async createSubmissionsForAssessment(
    assessment: Assessment,
  ) {
    const classEntity = await this.classRepo.findOne({
      where: { id: assessment.class.id },
      relations: ['enrollments', 'enrollments.user'],
    });

    if (!classEntity) return;

    if (!assessment.allowTeamSubmition) {
      for (const student of classEntity.enrollments) {
        await this.submissionRepo.save({
          assessment,
          user: student.user,
          status: SubmissionStatus.PENDING,
          attemptNumber: 0,
        });
      }
    } else {
      const teams = await this.teamRepo.find({
        where: { class: { id: assessment.class.id } },
      });

      for (const team of teams) {
        await this.submissionRepo.save({
          assessment,
          team,
          status: SubmissionStatus.PENDING,
          attemptNumber: 0,
        });
      }
    }
  }

  async submitAssignment(
    userId: number,
    assessmentId: number,
    dto: SubmitAssignmentDto,
  ) {
    // 1. Fetch assessment
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class'],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    // 2. Check enrollment
    const isEnrolled = await this.enrollmentRepo.findOne({
      where: { user: { id: userId }, class: { id: assessment.class.id } },
    });
    if (!isEnrolled) throw new ForbiddenException('Not enrolled in class');

    // 3. Team logic
    let team: Team;
    if (assessment.allowTeamSubmition) {
      team = await this.teamRepo.findOne({
        where: { class: { id: assessment.class.id }, members: { user: { id: userId } } },
      });
      if (!team)
        throw new BadRequestException('Team assignment but you are not in a team');
    }

    // 4. Fetch existing submission
    const submission = await this.submissionRepo.findOne({
      where: assessment.allowTeamSubmition
        ? { assessment: { id: assessmentId }, team: { id: team.id } }
        : { assessment: { id: assessmentId }, user: { id: userId } },
    });

    if (!submission) throw new NotFoundException('Submission record not found');

    // 5. Update submission status and attempt number
    const now = new Date();
    let status = SubmissionStatus.SUBMITTED;
    if (now > assessment.dueDate) {
      status = assessment.allowLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED;
    }

    submission.submissionTime = now;
    submission.status = submission.status === SubmissionStatus.PENDING ? status : SubmissionStatus.RESUBMITTED;
    submission.attemptNumber += 1;

    if (dto.comments) {
      submission.comments = dto.comments;
    }

    await this.submissionRepo.save(submission);

    // -----------------------------
    // 🔥 ATTACH RESOURCES USING resourceId ONLY
    // -----------------------------
    if (dto.resources && dto.resources.length > 0) {
      for (const resDto of dto.resources) {
        // Fetch existing resource
        const resource = await this.resourceRepo.findOne({ where: { id: resDto.resourceId } });
        if (!resource) {
          throw new BadRequestException(`Resource ${resDto.resourceId} not found`);
        }
        if (assessment.allowedSubmissionMethod == SubmissionMethod.GITHUB && resource.type != ResourceType.URL) {
          throw new BadRequestException(`Resource ${resDto.resourceId} Must be a github`);

        }

        // Check if already linked
        const exists = await this.subResourceRepo.findOne({
          where: { submission: { id: submission.id }, resource: { id: resource.id } },
        });

        if (!exists) {
          const subRes = this.subResourceRepo.create({
            submission,
            resource,
          });
          await this.subResourceRepo.save(subRes);
        }
      }
    }

    // -----------------------------
    // 🔥 GITHUB URL (optional)
    // -----------------------------
    if (dto.githubUrl) {
      const resource = await this.resourceRepo.save({
        title: `GitHub: ${assessment.title}`,
        type: ResourceType.URL,
        url: dto.githubUrl,
        owner: `${userId}`,
      });

      await this.subResourceRepo.save({
        submission,
        resource,
      });
    }

    // -----------------------------
    // 🔥 AI Evaluation (if enabled)
    // -----------------------------
    if (assessment.aiEvaluationEnable) {
      this.aiEvaluationService.addTaskToQueue(submission.id.toString());
    }

    return {
      message: 'Submitted successfully',
      submissionId: submission.id,
    };
  }


  // --- 3. Grade Submission ---
  async gradeSubmission(
    teacherId: number,
    submissionId: number,
    dto: GradeSubmissionDTO,
  ) {
    // 1. Fetch submission with evaluation and relationship relations
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: [
        'evaluation',
        'assessment',
        'assessment.class',
        'assessment.class.owner',
      ],
    });

    if (!submission) throw new NotFoundException('Submission not found');

    // Authorization: only class owner can grade
    if (submission.assessment?.class?.owner?.id !== teacherId) {
      throw new BadRequestException('Unauthorized');
    }

    // 2. 👈 Check if evaluation exists, if not create a new one
    let evaluation = submission.evaluation;
    if (!evaluation) {
      evaluation = this.evaluationRepo.create({
        submission,
        evaluationType: EvaluationType.MANUAL
      });
    }

    // 3. Update evaluation details
    evaluation.score = dto.score;
    evaluation.feedback = dto.feedback;
    await this.evaluationRepo.save(evaluation);

    // 4. Update submission status
    submission.status = SubmissionStatus.GRADED;
    await this.submissionRepo.save(submission);

    return evaluation;
  }

  // Teacher or submitter/team member can view a submission
  async getSubmissionForViewer(userId: number, submissionId: number) {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: [
        'user',
        'team',
        'team.members',
        'team.members.user',
        'assessment',
        'assessment.class',
        'assessment.class.owner',
        'resources',
        'resources.resource',
        'evaluation',
      ],
    });
    if (!submission) throw new NotFoundException('Submission not found');

    const isTeacher = submission.assessment.class.owner.id === userId;
    const isOwner = submission.user?.id === userId;
    const isTeamMember =
      submission.team?.members?.some((m) => m.user?.id === userId) ?? false;

    if (!isTeacher && !isOwner && !isTeamMember) {
      throw new BadRequestException('Unauthorized');
    }

    const result = {
      id: submission.id,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      submissionTime: submission.submissionTime,
      status: submission.status,
      attemptNumber: submission.attemptNumber,

      // Only needed user fields
      user: submission.user
        ? {
          id: submission.user.id,
          firstName: submission.user.firstName,
          lastName: submission.user.lastName,
        }
        : null,

      // Team and members
      team: submission.team
        ? {
          id: submission.team.id,
          name: submission.team.name,
          maxMember: submission.team.maxMember,
          members: submission.team.members.map((member) => ({
            id: member.id,
            enrollDate: member.enrollDate,
            isApproved: member.isApproved,
            user: member.user
              ? {
                id: member.user.id,
                firstName: member.user.firstName,
                lastName: member.user.lastName,
              }
              : null,
          })),
        }
        : null,

      // Assessment
      assessment: submission.assessment
        ? {
          id: submission.assessment.id,
          title: submission.assessment.title,
          instruction: submission.assessment.instruction,
          dueDate: submission.assessment.dueDate,
          startDate: submission.assessment.startDate,
          maxScore: submission.assessment.maxScore,
          submissionType: submission.assessment.submissionType,
          allowLate: submission.assessment.allowLate,
          penaltyCriteria: submission.assessment.penaltyCriteria,
          aiEvaluationEnable: submission.assessment.aiEvaluationEnable,
          allowTeamSubmition: submission.assessment.allowTeamSubmition,
          class: submission.assessment.class
            ? {
              id: submission.assessment.class.id,
              name: submission.assessment.class.name,
              description: submission.assessment.class.description,
              status: submission.assessment.class.status,
            }
            : null,
        }
        : null,

      // Evaluation
      evaluation: submission.evaluation ?? null,

      // Resources
      resources: submission.resources.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        resource: r.resource
          ? {
            id: r.resource.id,
            title: r.resource.title,
            type: r.resource.type,
            url: r.resource.url,
            owner: r.resource.owner,
            description: r.resource.description,
            created_at: r.resource.created_at,
            updated_at: r.resource.updated_at ?? null,
          }
          : null,
      })),
    };

    return result;
  }

  // --- 4. Get Tracking (Roster View) ---
  async getTracking(assessmentId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class'],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const submissions = await this.submissionRepo.find({
      where: { assessment: { id: assessmentId } },
      relations: ['user', 'team', 'evaluation'],
    });

    // Strategy A: Team Tracking
    if (assessment.allowTeamSubmition) {
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

  /**
   * 5. Get All Assignments for a Class (Dashboard View)
   * Sorted by Due Date (soonest first)
   */
  async findAllByClass(classId: number) {
    return await this.assessmentRepo.find({
      where: { class: { id: classId } },
      order: { dueDate: 'ASC' },
      relations: ['resources', 'resources.resource'], // Show attached PDFs/Files
    });
  }

  /**
   * 5. Get All Assignments for a Class (Dashboard View)
   * Sorted by Due Date (soonest first)
   */
  async findAllByClassSession(classId: number, sessionId: number) {
    return await this.assessmentRepo.find({
      where: { class: { id: classId }, session: sessionId },
      order: { dueDate: 'ASC' },
      relations: ['resources', 'resources.resource'], // Show attached PDFs/Files
    });
  }

  /**
   * 6. Get Single Assessment Details
   * (Student clicks on assignment to see instructions)
   */
  async findOne(assessmentId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['resources', 'resources.resource', 'class'],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  /**
   * 8. DELETE Assessment
   * Teacher removes assignment.
   * (Ideally soft-delete, but hard-delete here for simplicity)
   */
  async deleteAssessment(userId: number, assessmentId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class', 'class.owner'],
    });

    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.class.owner.id !== userId)
      throw new BadRequestException('Unauthorized');

    // Optional: Check if students have already submitted?
    // const count = await this.submissionRepo.count({ where: { assessment: { id: assessmentId } } });
    // if (count > 0) throw new BadRequestException('Cannot delete assignment with existing submissions');

    return await this.assessmentRepo.remove(assessment);
  }

  /**
   * 9. GET STUDENT SUBMISSION STATUS (The "Sync" Logic)
   * This handles the Team Synchronization.
   */
  async getMySubmission(userId: number, assessmentId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class'],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    let whereCondition: any = {};

    // --- TEAM SYNC LOGIC ---
    if (assessment.allowTeamSubmition) {
      // 1. Find user's team in this class
      const team = await this.teamRepo.findOne({
        where: {
          class: { id: assessment.class.id },
          members: { user: { id: userId } },
        },
      });

      if (!team) {
        // User is not in a team yet, so they definitely haven't submitted
        return { status: SubmissionStatus.PENDING, message: 'Not in a team' };
      }

      // 2. Look for submission by TEAM ID (not User ID)
      whereCondition = {
        assessment: { id: assessmentId },
        team: { id: team.id },
      };
    } else {
      // --- INDIVIDUAL LOGIC ---
      whereCondition = {
        assessment: { id: assessmentId },
        user: { id: userId },
      };
    }

    // Fetch submission
    const submission = await this.submissionRepo.findOne({
      where: whereCondition,
      relations: ['resources', 'resources.resource', 'evaluation'],
    });

    if (!submission) {
      return { status: SubmissionStatus.PENDING, resources: [] };
    }

    return submission;
    // If Team A submits, User B (who is in Team A) calls this,
    // logic finds Team A's submission, and returns it. Sync complete.
  }

  async getMySubmissionsStatus(userId: number, classId: number) {
    // 1. Fetch all assessments for the class
    const assessments = await this.assessmentRepo.find({
      where: { class: { id: classId } },
    });

    // 2. Fetch submissions of this user in this class
    const submissions = await this.submissionRepo.find({
      where: {
        user: { id: userId },
        assessment: { class: { id: classId } },
      },
      relations: ['evaluation'],
    });

    if (submissions.length == 0) {
      return []
    }

    // 3. Map assessments to include the submission status
    const results = assessments.map((assessment) => {
      const submission = submissions.find(
        (s) => s.assessment.id === assessment.id
      );

      return {
        assessmentId: assessment.id,
        title: assessment.title,
        dueDate: assessment.dueDate,
        status: submission ? submission.status : 'PENDING',
        submissionId: submission?.id || null,
        grade: submission?.evaluation?.score || null,
      };
    });

    return results;
  }

  async getAssignmentRoster(assessmentId: number) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['class'],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    // 1. Fetch all submissions for this assessment
    const submissions = await this.submissionRepo.find({
      where: { assessment: { id: assessmentId } },
      relations: ['user', 'team', 'evaluation'],
    });

    // --- CASE A: TEAM ASSIGNMENT ---
    if (assessment.allowTeamSubmition) {
      // Fetch all teams in the class
      const teams = await this.teamRepo.find({
        where: { class: { id: assessment.class.id } },
        relations: ['members', 'members.user'], // Need members to show teacher who is in the team
      });

      return teams.map((team) => {
        // Find if this team has a submission
        const sub = submissions.find((s) => s.team?.id === team.id);

        return {
          type: 'TEAM',
          id: team.id,
          name: team.name, // "Team Alpha"
          members: team.members.map((m) => ({
            userId: m.user.id,
            fullName: `${m.user.firstName} ${m.user.lastName}`,
            profileUrl: m.user.profilePictureUrl,
          })),
          status: sub ? sub.status : 'NOT_SUBMITTED', // This is what you asked for
          submissionId: sub?.id || null,
          score: sub?.evaluation?.score || null,
          submittedAt: sub?.submissionTime || null,
        };
      });
    }

    // --- CASE B: INDIVIDUAL ASSIGNMENT ---
    else {
      // Fetch all students enrolled in the class
      const enrollments = await this.enrollmentRepo.find({
        where: { class: { id: assessment.class.id } },
        relations: ['user'],
      });

      return enrollments.map((enrollment) => {
        const student = enrollment.user;
        // Find if this specific student has a submission
        const sub = submissions.find((s) => s.user?.id === student.id);

        return {
          type: 'INDIVIDUAL',
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          profileUrl: student.profilePictureUrl,
          status: sub ? sub.status : 'NOT_SUBMITTED', // <--- Logic here
          submissionId: sub?.id || null,
          score: sub?.evaluation?.score || null,
          submittedAt: sub?.submissionTime || null,
        };
      });
    }
  }

  /**
   * GET DASHBOARD STATS (Optional but useful)
   * Returns: { total: 30, submitted: 15, graded: 5 }
   */
  async getAssessmentStats(assessmentId: number) {
    const roster = await this.getAssignmentRoster(assessmentId);

    const total = roster.length;
    const submitted = roster.filter((r) => r.status !== 'NOT_SUBMITTED').length;
    const graded = roster.filter(
      (r) => r.status === 'GRADED' || r.status === 'EVALUATED',
    ).length;

    return {
      totalStudentsOrTeams: total,
      submittedCount: submitted,
      pendingCount: total - submitted,
      gradedCount: graded,
    };
  }


  async evaluateSubmission(
    submissionId: number,
    totalScore: number,
    feedback: string,
  ) {
    //  Get the submission
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Create or update evaluation
    let evaluation = await this.evaluationRepo.findOne({
      where: { submission: { id: submissionId } },
    });


    if (!evaluation) {
      // Create new evaluation
      evaluation = this.evaluationRepo.create({
        submission,
        score: totalScore,
        feedback,
        evaluationType: EvaluationType.MANUAL,
      });
    } else {
      // Update existing evaluation
      evaluation.score = totalScore;
      evaluation.feedback = feedback;
    }

    await this.evaluationRepo.save(evaluation);

    return evaluation;
  }


  async addFeedbackLineByLine(userId: number, submissionId: number, dto: FeedbackItemDto) {
    // 1. 👈 Verify ownership
    const submission = await this.checkOwnership(userId, submissionId);

    let evaluation = await this.evaluationRepo.findOne({
      where: { submission: { id: submissionId } },
    });

    if (!evaluation) {
      evaluation = this.evaluationRepo.create({
        submission,
        score: 0,
        feedback: '',
        evaluationType: EvaluationType.AI,
      });
      await this.evaluationRepo.save(evaluation);
    }

    if (dto && dto.path) {
      const feedbackEntity = this.evaluationFeedbackRepo.create({
        evaluation: evaluation,
        filePath: dto.path,
        startLine: dto.startLine,
        endLine: dto.endLine,
        message: dto.message,
        feedbackType: dto.type,
      });

      await this.evaluationFeedbackRepo.save(feedbackEntity);
    }

    return {
      message: 'Feedback item added successfully',
      evaluationId: evaluation.id,
      addedItemsCount: dto ? 1 : 0,
    };
  }

  async updateSingleFeedback(userId: number, feedbackId: string, dto: FeedbackItemDto) {
    const feedback = await this.evaluationFeedbackRepo.findOne({
      where: { id: feedbackId },
      relations: ['evaluation', 'evaluation.submission', 'evaluation.submission.assessment', 'evaluation.submission.assessment.class', 'evaluation.submission.assessment.class.owner'],
    });

    if (!feedback) {
      throw new NotFoundException('Feedback item not found');
    }

    if (feedback.evaluation.submission.assessment.class.owner.id !== userId) {
      throw new ForbiddenException('You do not have permission to update this feedback');
    }

    // 2. Update fields
    feedback.filePath = dto.path;
    feedback.startLine = dto.startLine;
    feedback.endLine = dto.endLine;
    feedback.message = dto.message;
    feedback.feedbackType = dto.type;

    await this.evaluationFeedbackRepo.save(feedback);

    return {
      message: 'Feedback item updated successfully',
      feedbackId: feedback.id,
    };
  }

  private async checkOwnership(userId: number, submissionId: number) {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['assessment', 'assessment.class', 'assessment.class.owner'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.assessment.class.owner.id !== userId) {
      throw new ForbiddenException('You do not have permission to evaluate this submission');
    }

    return submission;
  }

  async getSubmissionDetails(submissionId: number) {
    console.log(`🟢 [Step 1] Fetching submission ID: ${submissionId}`);

    // 1️⃣ Fetch submission with related assessment, rubrics, and resources
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: [
        'assessment',
        'assessment.rubrics',
        'resources',
        'resources.resource',
        'assessment.class',
        'assessment.class.owner',
        'evaluation'
      ],
    });

    if (!submission) {
      console.log(`❌ Submission ${submissionId} not found in database`);
      throw new NotFoundException('Submission not found');
    }
    if (submission.evaluation) {
      throw new BadRequestException('Submission already evaluated');
    }
    console.log(`✅ Submission fetched: ID ${submission.id}, User ${submission.userId}`);

    const assessment = submission.assessment;

    // 2️⃣ If AI evaluation is NOT enabled → prevent sending to Python
    if (!assessment.aiEvaluationEnable) {
      console.log(`⚠️ AI evaluation not enabled for submission ${submissionId}, skipping Python`);
      throw new NotFoundException('Submission not found');
    }
    console.log(`✅ AI evaluation is enabled for submission ${submissionId}`);

    const R2_KEY = `${submission.userId}/submission/${submission.id}`;

    // 3️⃣ Determine main resource URL (GitHub > fallback R2 folder)
    let resourceUrl: string | null = null;
    if (assessment.allowedSubmissionMethod === SubmissionMethod.ANY || assessment.allowedSubmissionMethod == SubmissionMethod.ZIP) {
      if (submission.resources && submission.resources.length > 0) {
        const githubRes = submission.resources.find(
          (sr) => sr.resource.type === ResourceType.URL && sr.resource.url.includes('github.com')
        );
        resourceUrl = githubRes ? githubRes.resource.url : R2_KEY;
        console.log(`🔗 Resource URL determined (ANY): ${resourceUrl}`);
      } else {
        resourceUrl = R2_KEY;
        console.log(`🔗 No resources found; using R2 folder: ${R2_KEY}`);
      }
    } else if (assessment.allowedSubmissionMethod === SubmissionMethod.GITHUB) {
      const githubRes = submission.resources?.find((sr) =>
        sr.resource.url.includes('github.com')
      );
      resourceUrl = githubRes ? githubRes.resource.url : null;
      console.log(`🔗 Resource URL determined (GITHUB only): ${resourceUrl}`);
    }

    // 4️⃣ Map rubrics
    const rubric = assessment.rubrics.map((r) => ({
      criterion: r.definition,
      weight: r.totalScore,
    }));
    console.log(`📋 Rubrics mapped: ${JSON.stringify(rubric, null, 2)}`);

    // 5️⃣ Determine AI key info
    console.log(`🤖 AI model selection mode: ${assessment.aiModelSelectionMode}`);

    if (assessment.aiModelSelectionMode === AIModelSelectionMode.SYSTEM) {
      console.log(`🔹 SYSTEM mode: sending submission without AI key`);
      return {
        submission_id: submission.id.toString(),
        instructions: assessment.instruction,
        resource_url: resourceUrl,
        rubric,
        ai: {
          provider: 'domrov',
          api_key: 'nothing',
          api_endpoint: 'domrov.edu',
          model: 'domrov',
          label: 'domrov',
        },
      };
    } else if (assessment.aiModelSelectionMode === AIModelSelectionMode.USER) {
      console.log(`🔹 USER mode: fetching latest valid AI key for user ${submission.userId}`);
      const userKey = await this.userAIKeyRepo.findOne({
        where: {
          userId: submission.assessment.class.owner.id,
          isActive: true,
          isValid: true,
        },
        order: { created_at: 'DESC' }, // latest key first
      });

      if (!userKey) {
        console.log(`❌ No valid AI key found for user ${submission.userId}`);
        throw new NotFoundException('Submission not found');
      }

      const decryptedKey = Encryption.decryptKey(userKey.encryptedKey);
      console.log(`🔑 AI key fetched and decrypted for user ${submission.userId}`);

      return {
        submission_id: submission.id.toString(),
        instructions: assessment.instruction,
        resource_url: resourceUrl,
        rubric,
        ai: {
          provider: userKey.provider,
          api_key: decryptedKey,
          api_endpoint: userKey.apiEndpoint,
          model: userKey.model,
          label: userKey.label,
        },
      };
    }

    // Fallback: prevent sending anything if mode is unknown
    console.log(`❌ Unknown AI model selection mode for submission ${submissionId}`);
    throw new NotFoundException('Submission not found');
  }


  async getSubmissionResoucrs(submissionId: number) {

    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: [
        'resources',
        'resources.resource',
        'assessment.class',
        'assessment.class.owner',
      ],
    });

    if (!submission) {
      console.log(`❌ Submission ${submissionId} not found in database`);
      throw new NotFoundException('Submission not found');
    }

    const assessment = submission.assessment;

    const R2_KEY = `${submission.userId}/submission/${submission.id}`;

    let resourceUrl: string | null = null;
    if (assessment.allowedSubmissionMethod === SubmissionMethod.ANY || assessment.allowedSubmissionMethod == SubmissionMethod.ZIP) {
      if (submission.resources && submission.resources.length > 0) {
        const githubRes = submission.resources.find(
          (sr) => sr.resource.type === ResourceType.URL && sr.resource.url.includes('github.com')
        );
        resourceUrl = githubRes ? githubRes.resource.url : R2_KEY;
        console.log(`🔗 Resource URL determined (ANY): ${resourceUrl}`);
      } else {
        resourceUrl = R2_KEY;
        console.log(`🔗 No resources found; using R2 folder: ${R2_KEY}`);
      }
    } else if (assessment.allowedSubmissionMethod === SubmissionMethod.GITHUB) {
      const githubRes = submission.resources?.find((sr) =>
        sr.resource.url.includes('github.com')
      );
      resourceUrl = githubRes ? githubRes.resource.url : null;
      console.log(`🔗 Resource URL determined (GITHUB only): ${resourceUrl}`);
    }

    return {
      resource_url: resourceUrl,
    };
  }

}