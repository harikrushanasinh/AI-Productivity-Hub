import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateCodeDto {
  @ApiProperty({ example: 'A function that debounces another function by N milliseconds' })
  @IsString()
  @MaxLength(2000)
  prompt: string;

  @ApiPropertyOptional({ example: 'typescript' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  language?: string;
}
