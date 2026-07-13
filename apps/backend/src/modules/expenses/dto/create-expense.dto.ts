import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ExpenseCategory, ExpenseType } from '../entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Grocery run' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 4599, description: 'Amount in minor units (cents), e.g. $45.99 = 4599' })
  @IsInt()
  @IsPositive()
  amountMinor: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ enum: ExpenseType })
  @IsOptional()
  @IsEnum(ExpenseType)
  type?: ExpenseType;

  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiProperty({ example: '2026-07-13' })
  @IsDateString()
  spentOn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
