import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { GoalMilestone } from '../entities/goal-milestone.entity';

@Injectable()
export class GoalsRepository {
  constructor(
    @InjectRepository(Goal) private readonly goalRepo: Repository<Goal>,
    @InjectRepository(GoalMilestone) private readonly milestoneRepo: Repository<GoalMilestone>,
  ) {}

  findAllByOwner(ownerId: string): Promise<Goal[]> {
    return this.goalRepo.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  findById(id: string, ownerId: string): Promise<Goal | null> {
    return this.goalRepo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<Goal>): Goal {
    return this.goalRepo.create(data);
  }

  save(goal: Goal): Promise<Goal> {
    return this.goalRepo.save(goal);
  }

  async softDelete(id: string): Promise<void> {
    await this.goalRepo.softDelete(id);
  }

  findMilestones(goalId: string): Promise<GoalMilestone[]> {
    return this.milestoneRepo.find({ where: { goalId }, order: { sortOrder: 'ASC' } });
  }

  findMilestoneById(id: string, goalId: string): Promise<GoalMilestone | null> {
    return this.milestoneRepo.findOne({ where: { id, goalId } });
  }

  createMilestone(data: Partial<GoalMilestone>): GoalMilestone {
    return this.milestoneRepo.create(data);
  }

  saveMilestone(milestone: GoalMilestone): Promise<GoalMilestone> {
    return this.milestoneRepo.save(milestone);
  }

  async deleteMilestone(id: string): Promise<void> {
    await this.milestoneRepo.delete(id);
  }

  countMilestones(goalId: string): Promise<number> {
    return this.milestoneRepo.count({ where: { goalId } });
  }

  countDoneMilestones(goalId: string): Promise<number> {
    return this.milestoneRepo.count({ where: { goalId, isDone: true } });
  }
}
