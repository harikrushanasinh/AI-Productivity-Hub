import { Column, Entity, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../core/database/base.entity';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  OWNER = 'owner',
}

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  // bcrypt hash — never returned in API responses (class-transformer @Exclude)
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  // Hash of the current valid refresh token, rotated on every refresh (RTR).
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;
}
