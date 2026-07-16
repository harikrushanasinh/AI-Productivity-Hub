import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

@Entity('files')
export class FileEntity extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  // The S3 object key — never the public URL, since access is always via a
  // short-lived presigned URL (see FileManagerService).
  @Column({ type: 'varchar', length: 1024, unique: true })
  storageKey: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeBytes: number;

  @Index()
  @Column({ type: 'varchar', length: 255, default: '/' })
  folderPath: string;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;
}
