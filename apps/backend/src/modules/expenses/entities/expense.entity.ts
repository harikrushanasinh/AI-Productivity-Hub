import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity';

export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  HOUSING = 'housing',
  UTILITIES = 'utilities',
  ENTERTAINMENT = 'entertainment',
  HEALTH = 'health',
  SHOPPING = 'shopping',
  EDUCATION = 'education',
  TRAVEL = 'travel',
  INCOME = 'income',
  OTHER = 'other',
}

export enum ExpenseType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

@Entity('expenses')
export class Expense extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  // Stored as integer minor units (cents) to avoid floating-point rounding errors
  // in financial calculations — never use `numeric`/`float` for money columns.
  @Column({ type: 'bigint' })
  amountMinor: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: ExpenseType, default: ExpenseType.EXPENSE })
  type: ExpenseType;

  @Index()
  @Column({ type: 'enum', enum: ExpenseCategory, default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Index()
  @Column({ type: 'date' })
  spentOn: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  receiptUrl: string | null;
}
