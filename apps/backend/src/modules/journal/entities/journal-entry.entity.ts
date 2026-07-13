import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum MoodLevel {
  VERY_LOW = 1,
  LOW = 2,
  NEUTRAL = 3,
  GOOD = 4,
  GREAT = 5,
}

@Entity('journal_entries')
@Index(['ownerId', 'entryDate'], { unique: true })
export class JournalEntry extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  // One entry per calendar day per user (enforced by the composite unique index above).
  @Column({ type: 'date' })
  entryDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'smallint', nullable: true })
  mood: MoodLevel | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  // Populated by the AI "Meeting Summary"/reflection-style features for journaling.
  @Column({ type: 'text', nullable: true })
  aiReflection: string | null;
}
