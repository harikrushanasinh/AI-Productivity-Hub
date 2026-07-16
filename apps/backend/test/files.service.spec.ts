import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FilesService } from '../src/modules/files/services/files.service';
import { FilesRepository } from '../src/modules/files/repositories/files.repository';
import { S3StorageService } from '../src/core/storage/s3-storage.service';

/**
 * Unit-level test: S3StorageService and FilesRepository are mocked so this
 * suite runs without real AWS credentials or a live database — appropriate
 * for CI. A separate integration test (against LocalStack or a sandbox
 * bucket) is recommended before production release; see docs/file-manager-module.md.
 */
describe('FilesService', () => {
  let service: FilesService;
  let repository: jest.Mocked<FilesRepository>;
  let storage: jest.Mocked<S3StorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: FilesRepository,
          useValue: {
            totalStorageUsed: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: S3StorageService,
          useValue: {
            buildStorageKey: jest.fn(),
            getUploadUrl: jest.fn(),
            getDownloadUrl: jest.fn(),
            deleteObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(FilesService);
    repository = module.get(FilesRepository);
    storage = module.get(S3StorageService);
  });

  it('rejects an upload that would exceed the storage quota', async () => {
    repository.totalStorageUsed.mockResolvedValue(5 * 1024 * 1024 * 1024 - 100); // near the 5GB quota

    await expect(
      service.requestUploadUrl('owner-1', {
        fileName: 'huge.zip',
        mimeType: 'application/pdf',
        sizeBytes: 1000,
        folderPath: '/',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('issues a presigned upload URL when within quota', async () => {
    repository.totalStorageUsed.mockResolvedValue(0);
    storage.buildStorageKey.mockReturnValue('users/owner-1/abc123.pdf');
    storage.getUploadUrl.mockResolvedValue('https://s3.example.com/presigned-put');

    const result = await service.requestUploadUrl('owner-1', {
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      folderPath: '/',
    });

    expect(result).toEqual({
      uploadUrl: 'https://s3.example.com/presigned-put',
      storageKey: 'users/owner-1/abc123.pdf',
    });
  });
});
