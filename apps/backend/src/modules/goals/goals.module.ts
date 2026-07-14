import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from './entities/goal.entity';
import { GoalMilestone } from './entities/goal-milestone.entity';
import { GoalsController } from './controllers/goals.controller';
import { GoalsService } from './services/goals.service';
import { GoalsRepository } from './repositories/goals.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Goal, GoalMilestone])],
  controllers: [GoalsController],
  providers: [GoalsService, GoalsRepository],
  exports: [GoalsService],
})
export class GoalsModule {}
