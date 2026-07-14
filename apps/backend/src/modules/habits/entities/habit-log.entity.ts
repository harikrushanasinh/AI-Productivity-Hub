import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

@Entity('habit_logs')
@Index(['habitId', 'completedOn'], { unique: true })
export class HabitLog extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  habitId: string;

  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  // One check-in per calendar day per habit (composite unique index above).
  @Column({ type: 'date' })
  completedOn: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
