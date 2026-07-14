import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class LogHabitDto {
  @ApiPropertyOptional({ description: 'Defaults to today (server date) if omitted' })
  @IsOptional()
  @IsDateString()
  completedOn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
