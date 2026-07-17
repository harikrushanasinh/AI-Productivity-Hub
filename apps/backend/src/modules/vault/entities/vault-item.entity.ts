import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum VaultItemCategory {
  LOGIN = 'login',
  CARD = 'card',
  NOTE = 'note',
  OTHER = 'other',
}

@Entity('vault_items')
export class VaultItem extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  url: string | null;

  @Column({ type: 'enum', enum: VaultItemCategory, default: VaultItemCategory.LOGIN })
  category: VaultItemCategory;

  @Column({ type: 'boolean', default: false })
  isFavorite: boolean;

  // Password is NEVER stored in plaintext — only the AES-256-GCM ciphertext,
  // IV, and auth tag. Decryption happens only in EncryptionService, only when
  // the /reveal endpoint is explicitly called.
  @Column({ type: 'text' })
  passwordCiphertext: string;

  @Column({ type: 'varchar', length: 64 })
  passwordIv: string;

  @Column({ type: 'varchar', length: 64 })
  passwordAuthTag: string;

  // Optional free-text notes, also encrypted at rest using the same scheme.
  @Column({ type: 'text', nullable: true })
  notesCiphertext: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  notesIv: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  notesAuthTag: string | null;
}
