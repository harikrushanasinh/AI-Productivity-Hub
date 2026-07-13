import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EventRecurrence } from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({ example: 'Team standup' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-07-14T09:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2026-07-14T09:30:00.000Z' })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ enum: EventRecurrence })
  @IsOptional()
  @IsEnum(EventRecurrence)
  recurrence?: EventRecurrence;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ description: 'Minutes before startAt to send a reminder' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080)
  reminderMinutesBefore?: number;
}
