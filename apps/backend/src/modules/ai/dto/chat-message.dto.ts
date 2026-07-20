import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ example: 'Summarize my open tasks for this week' })
  @IsString()
  @MaxLength(8000)
  message: string;

  @ApiPropertyOptional({ description: 'Omit to start a new conversation' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
