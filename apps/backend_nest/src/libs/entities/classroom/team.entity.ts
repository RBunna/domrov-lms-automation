import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    OneToMany,
    JoinTable,
    ManyToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Class } from './class.entity';
import { TeamMember } from './user-team.entity';
import { Assessment } from '../assessment/assessment.entity';
import { TeamAssessment } from './team-assessment.entity';

@Entity({ name: 'teams' })
export class Team extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 300 })
    name: string;

    @Column({ unique: true, length: 6 })
    joinCode: string;

    @Column()
    maxMember: number;

    @ManyToOne(() => User, (user) => user.leadTeams, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    leader: User;

    @ManyToOne(() => Class, (cls) => cls.teams, { onDelete: 'CASCADE' })
    @JoinColumn()
    class: Class;
    
    @OneToMany(() => TeamAssessment, (ta) => ta.team)
    teamAssessments: TeamAssessment[];


    @OneToMany(() => TeamMember, (member) => member.team)
    members: TeamMember[];
}
