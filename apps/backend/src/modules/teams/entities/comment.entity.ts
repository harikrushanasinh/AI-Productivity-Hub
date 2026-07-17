import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

/**
 * Generic, polymorphic comment — attachable to any resource in the platform
 * (a Task, a Note, a Goal, ...) by storing the target's type + id rather than
 * a hard foreign key to one specific table. This lets Team Collaboration add
 * threaded discussion to existing modules without those modules needing to
 * know Comments exist.
 */
@Entity('comments')
export class Comment extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  teamId: string;

  @Column({ type: 'uuid' })
  authorId: string;

  // e.g. "task", "note", "goal" — the module-defined resource type being discussed.
  @Index()
  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Index()
  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'text' })
  content: string;
}
