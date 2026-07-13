import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpensesRepository } from '../repositories/expenses.repository';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { QueryExpensesDto } from '../dto/query-expenses.dto';
import { Expense } from '../entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  async list(ownerId: string, query: QueryExpensesDto) {
    const [items, total] = await this.expensesRepository.findAndPaginate(ownerId, query);
    return {
      items,
      meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async findOne(id: string, ownerId: string): Promise<Expense> {
    const expense = await this.expensesRepository.findById(id, ownerId);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async summary(ownerId: string, from?: string, to?: string) {
    const rows = await this.expensesRepository.summary(ownerId, from, to);
    const totals = { income: 0, expense: 0 };
    for (const row of rows) {
      totals[row.type as 'income' | 'expense'] = Number(row.total);
    }
    return { ...totals, net: totals.income - totals.expense };
  }

  create(ownerId: string, dto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expensesRepository.create({ ...dto, ownerId, createdBy: ownerId });
    return this.expensesRepository.save(expense);
  }

  async update(id: string, ownerId: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id, ownerId);
    Object.assign(expense, dto, { updatedBy: ownerId });
    return this.expensesRepository.save(expense);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOne(id, ownerId);
    await this.expensesRepository.softDelete(id);
  }
}
