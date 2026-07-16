import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsPositive, IsString, Max, MaxLength } from 'class-validator';

// Allow-list of accepted MIME types — deliberately restrictive to reduce the
// attack surface of "secure file upload" (never accept arbitrary/executable types).
const ALLOWED_MIME_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export class RequestUploadUrlDto {
  @ApiProperty({ example: 'quarterly-report.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ enum: ALLOWED_MIME_TYPES })
  @IsString()
  @IsIn(ALLOWED_MIME_TYPES)
  mimeType: string;

  @ApiProperty({ example: 204800, description: 'File size in bytes (max 25MB)' })
  @IsInt()
  @IsPositive()
  @Max(MAX_FILE_SIZE_BYTES)
  sizeBytes: number;

  @ApiProperty({ example: '/reports', required: false })
  @IsString()
  @MaxLength(255)
  folderPath: string = '/';
}

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
