import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TeamRole } from '../entities/team-member.entity';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: TeamRole })
  @IsEnum(TeamRole)
  role: TeamRole;
}
