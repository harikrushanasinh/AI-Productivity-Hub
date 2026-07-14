import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

@Entity('goal_milestones')
export class GoalMilestone extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  goalId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'boolean', default: false })
  isDone: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
