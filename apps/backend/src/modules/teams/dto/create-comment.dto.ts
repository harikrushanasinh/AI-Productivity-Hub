import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, MaxLength } from 'class-validator';

const COMMENTABLE_ENTITY_TYPES = ['task', 'note', 'goal', 'calendar_event'];

export class CreateCommentDto {
  @ApiProperty({ enum: COMMENTABLE_ENTITY_TYPES })
  @IsString()
  @IsIn(COMMENTABLE_ENTITY_TYPES)
  entityType: string;

  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  content: string;
}

export { COMMENTABLE_ENTITY_TYPES };
