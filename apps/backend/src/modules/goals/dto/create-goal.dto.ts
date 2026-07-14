import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { GoalCategory } from '../entities/goal.entity';

export class CreateGoalDto {
  @ApiProperty({ example: 'Run a half marathon' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: GoalCategory })
  @IsOptional()
  @IsEnum(GoalCategory)
  category?: GoalCategory;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;
}
