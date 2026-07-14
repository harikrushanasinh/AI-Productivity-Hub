import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

@Entity('habits')
export class Habit extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: HabitFrequency, default: HabitFrequency.DAILY })
  frequency: HabitFrequency;

  // For WEEKLY habits: how many times per week counts as "done" for that week.
  @Column({ type: 'int', default: 1 })
  targetPerPeriod: number;

  @Column({ type: 'varchar', length: 20, default: '#6366f1' })
  color: string;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;
}
