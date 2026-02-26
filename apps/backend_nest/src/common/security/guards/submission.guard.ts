import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuardService } from '../services/permission-guard.service';
import { UserRole } from '../../../libs/enums/Role';
import {
  AuthenticatedRequest,
  SubmissionContext,
} from '../dtos/guard.dto';

export const SUBMISSION_ID_KEY = 'submissionIdParam';

/**
 * Decorator to specify custom submission ID parameter name
 */
export const SubmissionIdParam = (paramName: string) =>
  Reflect.metadata(SUBMISSION_ID_KEY, paramName);

@Injectable()
abstract class BaseSubmissionGuard implements CanActivate {
  constructor(
    protected readonly reflector: Reflector,
    protected readonly permissionService: PermissionGuardService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get submission ID param name from decorator or default to 'submission_id'
    const submissionIdParam =
      this.reflector.getAllAndOverride<string>(SUBMISSION_ID_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || 'submission_id';

    // Extract submissionId from params, query, or body
    const submissionId = this.extractSubmissionId(request, submissionIdParam);

    if (!submissionId) {
      throw new NotFoundException('Submission ID not provided');
    }

    // Get submission context and attach to request
    const submissionContext = await this.permissionService.getSubmissionContext(
      user.id,
      submissionId,
    );

    if(!submissionContext) {
      throw new NotFoundException('Submission not found');
    }

    request.submissionContext = submissionContext ?? undefined;
    request.classContext = submissionContext?.classContext ?? undefined;

    // Call subclass implementation
    return this.checkPermission(
      context,
      user.id,
      submissionId,
      submissionContext,
    );
  }

  /**
   * Extracts submission_id from params, query, or body safely
   */
  protected extractSubmissionId(
    request: AuthenticatedRequest,
    paramName: string,
  ): number | undefined {
    const sources: Record<string, unknown>[] = [
      request.params || {},
      request.query || {},
      request.body || {},
    ];

    for (const source of sources) {
      if (paramName in source) {
        const val = source[paramName];
        const n = typeof val === 'number' ? val : Number(val);
        if (!Number.isNaN(n)) return n;
      }
    }

    return undefined;
  }

  protected abstract checkPermission(
    context: ExecutionContext,
    userId: number,
    submissionId: number,
    submissionContext: SubmissionContext | null,
  ): Promise<boolean>;
}

// ===================== Guards =====================

// Checks if user is enrolled in the submission's class
@Injectable()
export class SubmissionMemberGuard extends BaseSubmissionGuard {
  protected async checkPermission(
    context: ExecutionContext,
    userId: number,
    submissionId: number,
    submissionContext: SubmissionContext | null,
  ): Promise<boolean> {
    if (!submissionContext) {
      throw new ForbiddenException('You are not enrolled in this class');
    }
    return true;
  }
}

// Checks if user is an instructor (Teacher or TA) in the submission's class
@Injectable()
export class SubmissionInstructorGuard extends BaseSubmissionGuard {
  protected async checkPermission(
    context: ExecutionContext,
    userId: number,
    submissionId: number,
    submissionContext: SubmissionContext | null,
  ): Promise<boolean> {
    if (!submissionContext) {
      throw new ForbiddenException('You are not enrolled in this class');
    }
    const { classContext } = submissionContext;
    const isInstructor =
      classContext.role === UserRole.Teacher ||
      classContext.role === UserRole.TeacherAssistant ||
      classContext.isOwner;

    if (!isInstructor) {
      throw new ForbiddenException('Only instructors can perform this action');
    }
    return true;
  }
}

// Checks if user is the class owner for the submission
@Injectable()
export class SubmissionOwnerGuard extends BaseSubmissionGuard {
  protected async checkPermission(
    context: ExecutionContext,
    userId: number,
    submissionId: number,
    submissionContext: SubmissionContext | null,
  ): Promise<boolean> {
    if (!submissionContext) {
      throw new ForbiddenException('You are not enrolled in this class');
    }
    if (!submissionContext.classContext.isOwner) {
      throw new ForbiddenException('Only the class owner can perform this action');
    }
    return true;
  }
}