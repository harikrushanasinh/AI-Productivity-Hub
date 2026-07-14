import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum GoalCategory {
  CAREER = 'career',
  HEALTH = 'health',
  FINANCE = 'finance',
  PERSONAL = 'personal',
  LEARNING = 'learning',
  OTHER = 'other',
}

@Entity('goals')
export class Goal extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: GoalCategory, default: GoalCategory.OTHER })
  category: GoalCategory;

  @Column({ type: 'date', nullable: true })
  targetDate: string | null;

  @Index()
  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVE })
  status: GoalStatus;

  // Manual progress override (0-100). If milestones exist, the API prefers a
  // milestone-derived percentage; this field acts as the fallback/base value.
  @Column({ type: 'int', default: 0 })
  progressPercent: number;
}
