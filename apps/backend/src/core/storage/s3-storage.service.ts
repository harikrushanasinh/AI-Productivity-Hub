import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * Thin wrapper around the S3 SDK, shared by any module needing object storage
 * (File Manager today; Bookmarks/AI Assistant attachments could reuse this later).
 *
 * Design: the API server NEVER proxies file bytes through itself. Instead it
 * issues short-lived presigned URLs so the browser uploads/downloads directly
 * to/from S3 — this keeps large file transfer off the NestJS process entirely.
 */
@Injectable()
export class S3StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('AWS_S3_BUCKET') ?? 'ai-productivity-hub-files';
    this.client = new S3Client({ region: this.config.get<string>('AWS_REGION') ?? 'us-east-1' });
  }

  /** Generates a unique, collision-proof object key namespaced by owner. */
  buildStorageKey(ownerId: string, originalFileName: string): string {
    const extension = originalFileName.includes('.')
      ? originalFileName.slice(originalFileName.lastIndexOf('.'))
      : '';
    return `users/${ownerId}/${randomUUID()}${extension}`;
  }

  async getUploadUrl(storageKey: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: mimeType,
    });
    return getSignedUrl(this.client, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS });
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: storageKey });
    return getSignedUrl(this.client, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS });
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }
}
