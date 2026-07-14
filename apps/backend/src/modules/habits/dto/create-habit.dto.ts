import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsHexColor, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { HabitFrequency } from '../entities/habit.entity';

export class CreateHabitDto {
  @ApiProperty({ example: 'Drink 2L of water' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: HabitFrequency })
  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @ApiPropertyOptional({ default: 1, description: 'Times per period required to count as done' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(21)
  targetPerPeriod?: number;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
