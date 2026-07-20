import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OcrImageDto {
  @ApiProperty({ description: 'Base64-encoded image data (no data: prefix)' })
  @IsString()
  base64Image: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  mediaType: string;
}
