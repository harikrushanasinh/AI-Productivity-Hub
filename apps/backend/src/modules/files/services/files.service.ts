import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { S3StorageService } from '../../../core/storage/s3-storage.service';
import { FilesRepository } from '../repositories/files.repository';
import { RequestUploadUrlDto } from '../dto/request-upload-url.dto';
import { ConfirmUploadDto } from '../dto/confirm-upload.dto';
import { FileEntity } from '../entities/file.entity';

const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // 5GB per user (placeholder tier limit)

@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly storage: S3StorageService,
  ) {}

  list(ownerId: string, folderPath?: string): Promise<FileEntity[]> {
    return this.filesRepository.findAllByOwner(ownerId, folderPath);
  }

  async findOne(id: string, ownerId: string): Promise<FileEntity> {
    const file = await this.filesRepository.findById(id, ownerId);
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  /**
   * Step 1 of the upload flow: check quota, mint a storage key, and return a
   * presigned PUT URL. The client uploads the raw bytes directly to S3 using
   * this URL — no file data ever touches the NestJS process.
   */
  async requestUploadUrl(ownerId: string, dto: RequestUploadUrlDto) {
    const currentUsage = await this.filesRepository.totalStorageUsed(ownerId);
    if (currentUsage + dto.sizeBytes > STORAGE_QUOTA_BYTES) {
      throw new ForbiddenException('Storage quota exceeded');
    }

    const storageKey = this.storage.buildStorageKey(ownerId, dto.fileName);
    const uploadUrl = await this.storage.getUploadUrl(storageKey, dto.mimeType);

    return { uploadUrl, storageKey };
  }

  /**
   * Step 2: after the browser successfully PUTs the file to S3, it calls this
   * to persist the metadata row. Nothing is queryable/listable until this
   * confirmation step completes, avoiding orphaned metadata for failed uploads.
   */
  async confirmUpload(
    ownerId: string,
    storageKey: string,
    meta: { fileName: string; mimeType: string; sizeBytes: number; folderPath: string },
  ): Promise<FileEntity> {
    const file = this.filesRepository.create({
      ownerId,
      originalName: meta.fileName,
      storageKey,
      mimeType: meta.mimeType,
      sizeBytes: meta.sizeBytes,
      folderPath: meta.folderPath,
      createdBy: ownerId,
    });
    return this.filesRepository.save(file);
  }

  async getDownloadUrl(id: string, ownerId: string): Promise<{ downloadUrl: string }> {
    const file = await this.findOne(id, ownerId);
    const downloadUrl = await this.storage.getDownloadUrl(file.storageKey);
    return { downloadUrl };
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const file = await this.findOne(id, ownerId);
    await this.storage.deleteObject(file.storageKey);
    await this.filesRepository.softDelete(file.id);
  }

  async storageStats(ownerId: string) {
    const usedBytes = await this.filesRepository.totalStorageUsed(ownerId);
    return { usedBytes, quotaBytes: STORAGE_QUOTA_BYTES, percentUsed: Math.round((usedBytes / STORAGE_QUOTA_BYTES) * 100) };
  }
}
