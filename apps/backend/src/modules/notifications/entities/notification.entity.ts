import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum NotificationType {
  INFO = 'info',
  REMINDER = 'reminder',
  MENTION = 'mention',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  // The recipient — every notification belongs to exactly one user's inbox.
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  // Optional deep link (e.g. "/tasks/abc-123") the frontend navigates to on click.
  @Column({ type: 'varchar', length: 255, nullable: true })
  link: string | null;

  // Which module generated this (e.g. "tasks", "calendar") — for icon/filtering.
  @Column({ type: 'varchar', length: 50, nullable: true })
  sourceModule: string | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isRead: boolean;
}
