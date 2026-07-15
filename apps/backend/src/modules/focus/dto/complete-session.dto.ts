import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CompleteSessionDto {
  @ApiProperty({ description: 'Actual elapsed seconds when the session ended' })
  @IsInt()
  @Min(0)
  actualSeconds: number;

  @ApiPropertyOptional({ default: false, description: 'True if the user stopped it early' })
  @IsOptional()
  @IsBoolean()
  interrupted?: boolean;
}
