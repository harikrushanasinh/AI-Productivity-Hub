import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class WriteEmailDto {
  @ApiProperty({ example: 'Ask my manager for two days off next week for a family event' })
  @IsString()
  @MaxLength(4000)
  intent: string;

  @ApiPropertyOptional({ example: 'formal', description: 'Desired tone, e.g. formal, warm, brief' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;
}
