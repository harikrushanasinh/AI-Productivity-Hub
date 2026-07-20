import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

@Entity('ai_conversations')
export class AiConversation extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  // Auto-generated from the first message (or user-renamed later).
  @Column({ type: 'varchar', length: 255, default: 'New conversation' })
  title: string;
}
