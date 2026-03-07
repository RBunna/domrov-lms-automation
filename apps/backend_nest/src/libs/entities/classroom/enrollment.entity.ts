import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Class } from './class.entity';
import { UserRole } from '../../enums/Role';
import { BaseEntity } from '../base.entity';

@Entity({ name: 'enrollments' })
// Composite index for permission checks: find enrollment by user+class (authorization in class.service.ts line 410)
@Index(['userId', 'classId'])
export class Enrollment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Class, (cls) => cls.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn()
  class: Class;

  @Column({ type: "enum", enum: UserRole, default: UserRole.Student })
  role: UserRole;

}
