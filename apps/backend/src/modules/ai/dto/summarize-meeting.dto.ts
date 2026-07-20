import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SummarizeMeetingDto {
  @ApiProperty({ description: 'Raw meeting transcript or notes' })
  @IsString()
  @MinLength(10)
  @MaxLength(20000)
  transcript: string;
}
