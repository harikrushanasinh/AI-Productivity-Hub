import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habit } from './entities/habit.entity';
import { HabitLog } from './entities/habit-log.entity';
import { HabitsController } from './controllers/habits.controller';
import { HabitsService } from './services/habits.service';
import { HabitsRepository } from './repositories/habits.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Habit, HabitLog])],
  controllers: [HabitsController],
  providers: [HabitsService, HabitsRepository],
  exports: [HabitsService],
})
export class HabitsModule {}
