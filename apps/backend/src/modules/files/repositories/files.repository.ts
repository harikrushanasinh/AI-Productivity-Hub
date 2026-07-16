import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../entities/file.entity';

@Injectable()
export class FilesRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly repo: Repository<FileEntity>,
  ) {}

  findAllByOwner(ownerId: string, folderPath?: string): Promise<FileEntity[]> {
    return this.repo.find({
      where: folderPath ? { ownerId, folderPath } : { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string, ownerId: string): Promise<FileEntity | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  findByStorageKey(storageKey: string): Promise<FileEntity | null> {
    return this.repo.findOne({ where: { storageKey } });
  }

  create(data: Partial<FileEntity>): FileEntity {
    return this.repo.create(data);
  }

  save(file: FileEntity): Promise<FileEntity> {
    return this.repo.save(file);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  /** Sum of all stored bytes for a user — powers storage-quota display. */
  async totalStorageUsed(ownerId: string): Promise<number> {
    const { total } = await this.repo
      .createQueryBuilder('file')
      .select('COALESCE(SUM(file.sizeBytes), 0)', 'total')
      .where('file.ownerId = :ownerId', { ownerId })
      .getRawOne();
    return Number(total);
  }
}
