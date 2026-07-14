import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalsRepository } from '../repositories/goals.repository';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { CreateMilestoneDto } from '../dto/create-milestone.dto';
import { Goal, GoalStatus } from '../entities/goal.entity';
import { GoalMilestone } from '../entities/goal-milestone.entity';

export interface GoalWithProgress extends Goal {
  computedProgress: number;
  milestones: GoalMilestone[];
}

@Injectable()
export class GoalsService {
  constructor(private readonly goalsRepository: GoalsRepository) {}

  async list(ownerId: string): Promise<GoalWithProgress[]> {
    const goals = await this.goalsRepository.findAllByOwner(ownerId);
    return Promise.all(goals.map((goal) => this.withProgress(goal)));
  }

  async findOne(id: string, ownerId: string): Promise<GoalWithProgress> {
    const goal = await this.getOwnedGoal(id, ownerId);
    return this.withProgress(goal);
  }

  create(ownerId: string, dto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalsRepository.create({ ...dto, ownerId, createdBy: ownerId });
    return this.goalsRepository.save(goal);
  }

  async update(id: string, ownerId: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.getOwnedGoal(id, ownerId);
    Object.assign(goal, dto, { updatedBy: ownerId });

    // Marking 100% or an explicit "completed" status keeps the other field in sync.
    if (dto.status === GoalStatus.COMPLETED) {
      goal.progressPercent = 100;
    } else if (dto.progressPercent === 100 && !dto.status) {
      goal.status = GoalStatus.COMPLETED;
    }

    return this.goalsRepository.save(goal);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.getOwnedGoal(id, ownerId);
    await this.goalsRepository.softDelete(id);
  }

  async addMilestone(goalId: string, ownerId: string, dto: CreateMilestoneDto) {
    await this.getOwnedGoal(goalId, ownerId);
    const milestone = this.goalsRepository.createMilestone({
      goalId,
      title: dto.title,
      createdBy: ownerId,
    });
    return this.goalsRepository.saveMilestone(milestone);
  }

  async toggleMilestone(goalId: string, milestoneId: string, ownerId: string) {
    await this.getOwnedGoal(goalId, ownerId);
    const milestone = await this.goalsRepository.findMilestoneById(milestoneId, goalId);
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    milestone.isDone = !milestone.isDone;
    return this.goalsRepository.saveMilestone(milestone);
  }

  async removeMilestone(goalId: string, milestoneId: string, ownerId: string): Promise<void> {
    await this.getOwnedGoal(goalId, ownerId);
    await this.goalsRepository.deleteMilestone(milestoneId);
  }

  private async getOwnedGoal(id: string, ownerId: string): Promise<Goal> {
    const goal = await this.goalsRepository.findById(id, ownerId);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  /**
   * If a goal has milestones, progress is DERIVED from milestone completion ratio
   * (source of truth). If it has none, we fall back to the manually-set
   * `progressPercent` field — giving users a lightweight option without milestones.
   */
  private async withProgress(goal: Goal): Promise<GoalWithProgress> {
    const milestones = await this.goalsRepository.findMilestones(goal.id);

    let computedProgress = goal.progressPercent;
    if (milestones.length > 0) {
      const done = milestones.filter((m) => m.isDone).length;
      computedProgress = Math.round((done / milestones.length) * 100);
    }

    return { ...goal, computedProgress, milestones };
  }
}
