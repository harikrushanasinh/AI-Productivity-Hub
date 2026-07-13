import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class QueryEventsDto {
  @ApiPropertyOptional({ description: 'Range start (ISO date)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Range end (ISO date)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
