import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

/**
 * Internal DTO — notifications are typically created by other backend modules
 * (e.g. Calendar reminders, Team Collaboration mentions) calling
 * NotificationsService.create() directly, not by an end-user-facing endpoint.
 * A REST create endpoint is still exposed for admin/testing/manual use.
 */
export class CreateNotificationDto {
  @ApiProperty({ description: 'Recipient user id' })
  @IsUUID()
  ownerId: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ example: 'Task due soon' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ example: '/tasks/abc-123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  link?: string;

  @ApiPropertyOptional({ example: 'tasks' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceModule?: string;
}
