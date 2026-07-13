import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseType } from '../entities/expense.entity';
import { QueryExpensesDto } from '../dto/query-expenses.dto';

@Injectable()
export class ExpensesRepository {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
  ) {}

  async findAndPaginate(ownerId: string, query: QueryExpensesDto): Promise<[Expense[], number]> {
    const qb = this.repo
      .createQueryBuilder('expense')
      .where('expense.ownerId = :ownerId', { ownerId });

    if (query.from) qb.andWhere('expense.spentOn >= :from', { from: query.from });
    if (query.to) qb.andWhere('expense.spentOn <= :to', { to: query.to });
    if (query.category) qb.andWhere('expense.category = :category', { category: query.category });
    if (query.type) qb.andWhere('expense.type = :type', { type: query.type });

    qb.orderBy('expense.spentOn', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    return qb.getManyAndCount();
  }

  findById(id: string, ownerId: string): Promise<Expense | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  /** Sums income vs expense (in minor units) for a date range — powers the Analytics summary. */
  async summary(
    ownerId: string,
    from?: string,
    to?: string,
  ): Promise<{ type: ExpenseType; total: string }[]> {
    const qb = this.repo
      .createQueryBuilder('expense')
      .select('expense.type', 'type')
      .addSelect('SUM(expense.amountMinor)', 'total')
      .where('expense.ownerId = :ownerId', { ownerId })
      .groupBy('expense.type');

    if (from) qb.andWhere('expense.spentOn >= :from', { from });
    if (to) qb.andWhere('expense.spentOn <= :to', { to });

    return qb.getRawMany();
  }

  create(data: Partial<Expense>): Expense {
    return this.repo.create(data);
  }

  save(expense: Expense): Promise<Expense> {
    return this.repo.save(expense);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
