import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateMilestoneDto {
  @ApiProperty({ example: 'Run 10k without stopping' })
  @IsString()
  @MaxLength(255)
  title: string;
}
