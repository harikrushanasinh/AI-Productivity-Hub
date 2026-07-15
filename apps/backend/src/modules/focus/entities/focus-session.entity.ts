import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum FocusSessionType {
  WORK = 'work',
  SHORT_BREAK = 'short_break',
  LONG_BREAK = 'long_break',
}

export enum FocusSessionStatus {
  COMPLETED = 'completed',
  INTERRUPTED = 'interrupted',
  RUNNING = 'running',
}

@Entity('focus_sessions')
export class FocusSession extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  // Optional link to a Task this session was spent on.
  @Column({ type: 'uuid', nullable: true })
  taskId: string | null;

  @Column({ type: 'enum', enum: FocusSessionType, default: FocusSessionType.WORK })
  type: FocusSessionType;

  @Column({ type: 'int' })
  plannedMinutes: number;

  // Actual elapsed seconds — may be less than plannedMinutes*60 if interrupted early.
  @Column({ type: 'int', default: 0 })
  actualSeconds: number;

  @Index()
  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'enum', enum: FocusSessionStatus, default: FocusSessionStatus.RUNNING })
  status: FocusSessionStatus;
}
