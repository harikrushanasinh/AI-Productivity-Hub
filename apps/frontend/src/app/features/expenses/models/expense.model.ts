export type ExpenseType = 'expense' | 'income';
export type ExpenseCategory =
  | 'food' | 'transport' | 'housing' | 'utilities' | 'entertainment'
  | 'health' | 'shopping' | 'education' | 'travel' | 'income' | 'other';

export interface Expense {
  id: string;
  title: string;
  amountMinor: number;
  currency: string;
  type: ExpenseType;
  category: ExpenseCategory;
  spentOn: string;
  notes: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ExpenseSummary {
  income: number;
  expense: number;
  net: number;
}
