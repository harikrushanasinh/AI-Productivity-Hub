import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum EventRecurrence {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('calendar_events')
export class CalendarEvent extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({ type: 'boolean', default: false })
  allDay: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'enum', enum: EventRecurrence, default: EventRecurrence.NONE })
  recurrence: EventRecurrence;

  @Column({ type: 'varchar', length: 20, default: '#6366f1' })
  color: string;

  // AI Smart Reminder: minutes before startAt to notify (null = no reminder)
  @Column({ type: 'int', nullable: true })
  reminderMinutesBefore: number | null;
}
