import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DailyPlannerDto {
  @ApiPropertyOptional({ description: 'Any extra context/preferences for today' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
