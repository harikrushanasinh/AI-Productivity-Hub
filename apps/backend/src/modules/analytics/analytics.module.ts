import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { HabitsModule } from '../habits/habits.module';
import { GoalsModule } from '../goals/goals.module';
import { FocusModule } from '../focus/focus.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';

@Module({
  // Imports (not re-declares) the other feature modules purely to reuse their
  // exported services — Analytics has zero database tables of its own.
  imports: [TasksModule, ExpensesModule, HabitsModule, GoalsModule, FocusModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
