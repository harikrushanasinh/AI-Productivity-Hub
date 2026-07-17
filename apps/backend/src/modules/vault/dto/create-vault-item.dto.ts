import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { VaultItemCategory } from '../entities/vault-item.entity';

export class CreateVaultItemDto {
  @ApiProperty({ example: 'GitHub' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @ApiProperty({ description: 'Plaintext password — encrypted server-side before storage, never logged' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({ example: 'https://github.com/login' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  url?: string;

  @ApiPropertyOptional({ enum: VaultItemCategory })
  @IsOptional()
  @IsEnum(VaultItemCategory)
  category?: VaultItemCategory;

  @ApiPropertyOptional({ description: 'Plaintext notes — also encrypted server-side' })
  @IsOptional()
  @IsString()
  notes?: string;
}
