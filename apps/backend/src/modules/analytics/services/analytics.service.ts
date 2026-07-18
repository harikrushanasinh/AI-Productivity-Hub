import { Injectable } from '@nestjs/common';
import { TasksService } from '../../tasks/services/tasks.service';
import { TaskStatus } from '../../tasks/entities/task.entity';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { HabitsService } from '../../habits/services/habits.service';
import { GoalsService } from '../../goals/services/goals.service';
import { GoalStatus } from '../../goals/entities/goal.entity';
import { FocusService } from '../../focus/services/focus.service';
import { AnalyticsDashboard } from '../dto/analytics-dashboard.interface';

/**
 * Analytics is deliberately a pure READ aggregator: it owns no database table
 * of its own and introduces no new source of truth. It composes existing
 * modules' public service methods (Clean Architecture: depend on their
 * service interfaces, never reach into their repositories directly), so any
 * business-rule change in Tasks/Expenses/Habits/Goals/Focus is automatically
 * reflected here without duplicated logic.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly tasksService: TasksService,
    private readonly expensesService: ExpensesService,
    private readonly habitsService: HabitsService,
    private readonly goalsService: GoalsService,
    private readonly focusService: FocusService,
  ) {}

  async getDashboard(ownerId: string): Promise<AnalyticsDashboard> {
    const [tasks, expensesSummary, habits, goals, focusToday, focusHistory] = await Promise.all([
      this.tasksService.list(ownerId),
      this.expensesService.summary(ownerId, this.firstOfMonthIso(), this.todayIso()),
      this.habitsService.list(ownerId),
      this.goalsService.list(ownerId),
      this.focusService.todayStats(ownerId),
      this.focusService.history(ownerId),
    ]);

    const done = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const todo = tasks.filter((t) => t.status === TaskStatus.TODO).length;

    const activeHabits = habits.filter((h) => !h.isArchived);
    const averageCurrentStreak = activeHabits.length
      ? Math.round(
          activeHabits.reduce((sum, h) => sum + h.currentStreak, 0) / activeHabits.length,
        )
      : 0;

    const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
    const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED);
    const averageProgress = goals.length
      ? Math.round(goals.reduce((sum, g) => sum + g.computedProgress, 0) / goals.length)
      : 0;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7DaysSeconds = focusHistory
      .filter((s) => new Date(s.startedAt).getTime() >= sevenDaysAgo && s.type === 'work')
      .reduce((sum, s) => sum + s.actualSeconds, 0);

    return {
      tasks: {
        total: tasks.length,
        done,
        inProgress,
        todo,
        completionRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
      },
      expenses: {
        monthIncome: expensesSummary.income,
        monthExpense: expensesSummary.expense,
        monthNet: expensesSummary.net,
      },
      habits: {
        activeCount: activeHabits.length,
        averageCurrentStreak,
      },
      goals: {
        activeCount: activeGoals.length,
        completedCount: completedGoals.length,
        averageProgress,
      },
      focus: {
        todayMinutes: focusToday.totalFocusedMinutes,
        last7DaysMinutes: Math.round(last7DaysSeconds / 60),
      },
    };
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private firstOfMonthIso(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }
}
