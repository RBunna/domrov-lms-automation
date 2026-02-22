import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { AIModelSelectionMode, SubmissionMethod, SubmissionType } from '../../enums/Assessment';
import { Class } from '../classroom/class.entity';
import { PlatformAIModel } from '../ai/platform-ai-model.entity';
import { Submission } from './submission.entity';
import { AssessmentResource } from '../resource/assessment-resource.entity';
import { Rubrics } from './rubic.entity';
import { Team } from '../classroom/team.entity';
import { TeamAssessment } from '../classroom/team-assessment.entity';


@Entity({ name: 'assessments' })
export class Assessment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 255 })
  title: string;
  @Column({ type: 'text' })
  instruction: string;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'int', default: 100 })
  maxScore: number;

  @Column({ type: 'int', default: 1 })
  session: number;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ type: 'enum', enum: SubmissionType })
  submissionType: SubmissionType;
  @Column({ default: false })
  allowLate: boolean;

  @OneToMany(() => Rubrics, rubric => rubric.assessment, {
    cascade: true,
  })
  rubrics: Rubrics[];

  @Column({ type: 'text', nullable: true })
  penaltyCriteria: string;

  @Column({ default: false })
  aiEvaluationEnable: boolean;

  @Column({ type: 'enum', enum: AIModelSelectionMode, default: AIModelSelectionMode.SYSTEM })
  aiModelSelectionMode: AIModelSelectionMode;

  @Column({ type: 'enum', enum: SubmissionMethod, default: SubmissionMethod.ANY })
  allowedSubmissionMethod: SubmissionMethod;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn()
  class: Class;

  @ManyToOne(() => PlatformAIModel, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  aiModel: PlatformAIModel;

  @OneToMany(() => Submission, (submission) => submission.assessment)
  submissions: Submission[];

  @OneToMany(() => TeamAssessment, (ta) => ta.assessment)
  teamAssessments: TeamAssessment[];


  @OneToMany(() => AssessmentResource, (ar) => ar.assessment)
  resources: AssessmentResource[];

}