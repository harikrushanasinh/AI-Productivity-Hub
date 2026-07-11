import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() email: string;
  @Expose() @ApiProperty() fullName: string;
  @Expose() @ApiProperty({ enum: UserRole }) role: UserRole;
  @Expose() @ApiProperty() isActive: boolean;
  @Expose() @ApiProperty({ nullable: true }) avatarUrl: string | null;
  @Expose() @ApiProperty() createdAt: Date;
}
