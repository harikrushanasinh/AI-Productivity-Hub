import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, MaxLength } from 'class-validator';

export class ConfirmUploadDto {
  @ApiProperty({ description: 'The storageKey returned by the upload-url request' })
  @IsString()
  storageKey: string;

  @ApiProperty({ example: 'quarterly-report.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 204800 })
  @IsInt()
  @IsPositive()
  sizeBytes: number;

  @ApiProperty({ example: '/reports', required: false })
  @IsString()
  @MaxLength(255)
  folderPath: string = '/';
}
