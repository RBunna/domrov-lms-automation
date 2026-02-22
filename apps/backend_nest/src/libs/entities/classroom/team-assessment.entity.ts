import { Entity, ManyToOne, JoinColumn, BaseEntity, PrimaryColumn, Unique } from 'typeorm';
import { Team } from './team.entity';
import { Assessment } from '../assessment/assessment.entity';

@Entity({ name: 'team_assessments' })
@Unique(['team', 'assessment'])
export class TeamAssessment extends BaseEntity {
    @PrimaryColumn()
    assessment_id: number;

    @PrimaryColumn()
    team_id: number;

    @ManyToOne(() => Team, (team) => team.teamAssessments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'team_id' })
    team: Team;

    @ManyToOne(() => Assessment, (assessment) => assessment.teamAssessments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assessment_id' })
    assessment: Assessment;
}