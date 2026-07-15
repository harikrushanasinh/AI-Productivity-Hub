import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { FocusSessionType } from '../entities/focus-session.entity';

export class StartSessionDto {
  @ApiPropertyOptional({ enum: FocusSessionType, default: FocusSessionType.WORK })
  @IsOptional()
  @IsEnum(FocusSessionType)
  type?: FocusSessionType;

  @ApiPropertyOptional({ default: 25, description: 'Planned session length in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  plannedMinutes?: number;

  @ApiPropertyOptional({ description: 'Optional task this session is spent working on' })
  @IsOptional()
  @IsUUID()
  taskId?: string;
}
