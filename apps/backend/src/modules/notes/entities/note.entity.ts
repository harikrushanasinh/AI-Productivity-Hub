import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

@Entity('notes')
export class Note extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  // Populated asynchronously by the AI "Smart Notes" feature (summarization).
  @Column({ type: 'text', nullable: true })
  aiSummary: string | null;
}
