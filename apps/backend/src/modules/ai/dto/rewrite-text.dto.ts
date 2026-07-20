import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum RewriteTone {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  CONCISE = 'concise',
  PERSUASIVE = 'persuasive',
}

export class RewriteTextDto {
  @ApiProperty({ example: 'hey can u send me that file when u get a sec' })
  @IsString()
  @MaxLength(8000)
  text: string;

  @ApiPropertyOptional({ enum: RewriteTone, default: RewriteTone.PROFESSIONAL })
  @IsOptional()
  @IsEnum(RewriteTone)
  tone?: RewriteTone;
}
