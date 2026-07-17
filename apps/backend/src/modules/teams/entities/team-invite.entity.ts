import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  REVOKED = 'revoked',
}

@Entity('team_invites')
export class TeamInvite extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  teamId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'uuid' })
  invitedBy: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token: string;

  @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.PENDING })
  status: InviteStatus;
}
