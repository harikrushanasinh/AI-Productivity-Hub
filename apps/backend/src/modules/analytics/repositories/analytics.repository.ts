import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../../tasks/entities/task.entity';
import { Goal, GoalStatus } from '../../goals/entities/goal.entity';
import { Expense, ExpenseType } from '../../expenses/entities/expense.entity';
import { Habit } from '../../habits/entities/habit.entity';
import { HabitLog } from '../../habits/entities/habit-log.entity';
import { FocusSession, FocusSessionType } from '../../focus/entities/focus-session.entity';
import { Note } from '../../notes/entities/note.entity';
import { Bookmark } from '../../bookmarks/entities/bookmark.entity';

/**
 * Analytics is deliberately READ-ONLY and queries other modules' tables
 * directly via their entity classes rather than depending on their Service
 * layers. This keeps Analytics decoupled from other modules' business logic
 * (it never calls TasksService.create(), etc.) while still being able to
 * report on their data — a common pattern for a reporting/dashboard layer.
 */
@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Goal) private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Expense) private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Habit) private readonly habitRepo: Repository<Habit>,
    @InjectRepository(HabitLog) private readonly habitLogRepo: Repository<HabitLog>,
    @InjectRepository(FocusSession) private readonly focusRepo: Repository<FocusSession>,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
    @InjectRepository(Bookmark) private readonly bookmarkRepo: Repository<Bookmark>,
  ) {}

  countTasksByStatus(ownerId: string): Promise<{ status: TaskStatus; count: string }[]> {
    return this.taskRepo
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.ownerId = :ownerId', { ownerId })
      .groupBy('task.status')
      .getRawMany();
  }

  countGoalsByStatus(ownerId: string): Promise<{ status: GoalStatus; count: string }[]> {
    return this.goalRepo
      .createQueryBuilder('goal')
      .select('goal.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('goal.ownerId = :ownerId', { ownerId })
      .groupBy('goal.status')
      .getRawMany();
  }

  async expenseSummaryForRange(
    ownerId: string,
    from: Date,
    to: Date,
  ): Promise<{ type: ExpenseType; total: string }[]> {
    return this.expenseRepo
      .createQueryBuilder('expense')
      .select('expense.type', 'type')
      .addSelect('SUM(expense.amountMinor)', 'total')
      .where('expense.ownerId = :ownerId', { ownerId })
      .andWhere('expense.spentOn >= :from', { from: from.toISOString().slice(0, 10) })
      .andWhere('expense.spentOn <= :to', { to: to.toISOString().slice(0, 10) })
      .groupBy('expense.type')
      .getRawMany();
  }

  totalHabits(ownerId: string): Promise<number> {
    return this.habitRepo.count({ where: { ownerId, isArchived: false } });
  }

  habitsCheckedInToday(ownerId: string, today: string): Promise<number> {
    return this.habitLogRepo
      .createQueryBuilder('log')
      .where('log.ownerId = :ownerId', { ownerId })
      .andWhere('log.completedOn = :today', { today })
      .getCount();
  }

  async focusSecondsInRange(ownerId: string, from: Date, to: Date): Promise<number> {
    const { total } = await this.focusRepo
      .createQueryBuilder('session')
      .select('COALESCE(SUM(session.actualSeconds), 0)', 'total')
      .where('session.ownerId = :ownerId', { ownerId })
      .andWhere('session.type = :type', { type: FocusSessionType.WORK })
      .andWhere('session.startedAt >= :from', { from })
      .andWhere('session.startedAt < :to', { to })
      .getRawOne();
    return Number(total);
  }

  /** Daily task-creation counts for the last N days — powers a simple trend chart. */
  async tasksCreatedTrend(
    ownerId: string,
    since: Date,
  ): Promise<{ day: string; count: string }[]> {
    return this.taskRepo
      .createQueryBuilder('task')
      .select("to_char(task.createdAt, 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('task.ownerId = :ownerId', { ownerId })
      .andWhere('task.createdAt >= :since', { since })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();
  }

  countNotes(ownerId: string): Promise<number> {
    return this.noteRepo.count({ where: { ownerId } });
  }

  countBookmarks(ownerId: string): Promise<number> {
    return this.bookmarkRepo.count({ where: { ownerId } });
  }
}
