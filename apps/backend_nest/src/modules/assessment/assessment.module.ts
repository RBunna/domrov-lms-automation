import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { FileService } from '../file/file.service';
import { EvaluationModule } from '../evaluation/evaluation.module';

// Entities
import { Assessment } from '../../../libs/entities/assessment/assessment.entity';
import { Submission } from '../../../libs/entities/assessment/submission.entity';
import { AssessmentResource } from '../../../libs/entities/resource/assessment-resource.entity';
import { Resource } from '../../../libs/entities/resource/resource.entity';
import { Class } from '../../../libs/entities/classroom/class.entity';
import { User } from '../../../libs/entities/user/user.entity';
import { Team } from '../../../libs/entities/classroom/team.entity';
import { Enrollment } from '../../../libs/entities/classroom/enrollment.entity';
import { SubmissionResource } from '../../../libs/entities/resource/submission-resource.entity';
import { Evaluation } from '../../../libs/entities/assessment/evaluation.entity';
import { Rubrics } from '../../../libs/entities/assessment/rubic.entity';
import { EvaluationFeedback } from '../../../libs/entities/assessment/evaluation-feedback.entity';
import { FileModule } from '../file/file.module';
import { UserAIKey } from '../../../libs/entities/ai/user-ai-key.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assessment,
      Submission,
      SubmissionResource,
      AssessmentResource,
      Resource,
      Evaluation,
      Class,
      User,
      Team,
      Enrollment,
      Rubrics,
      EvaluationFeedback,
      FileModule,
      UserAIKey
    ]),
    forwardRef(() => EvaluationModule), // <-- import with forwardRef to resolve circular dependency
  ],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule { }
