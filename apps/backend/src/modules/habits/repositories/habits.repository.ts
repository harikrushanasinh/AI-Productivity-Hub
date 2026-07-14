import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../entities/habit.entity';
import { HabitLog } from '../entities/habit-log.entity';

@Injectable()
export class HabitsRepository {
  constructor(
    @InjectRepository(Habit) private readonly habitRepo: Repository<Habit>,
    @InjectRepository(HabitLog) private readonly logRepo: Repository<HabitLog>,
  ) {}

  findAllByOwner(ownerId: string): Promise<Habit[]> {
    return this.habitRepo.find({ where: { ownerId }, order: { createdAt: 'ASC' } });
  }

  findById(id: string, ownerId: string): Promise<Habit | null> {
    return this.habitRepo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<Habit>): Habit {
    return this.habitRepo.create(data);
  }

  save(habit: Habit): Promise<Habit> {
    return this.habitRepo.save(habit);
  }

  async softDelete(id: string): Promise<void> {
    await this.habitRepo.softDelete(id);
  }

  findLogsForHabit(habitId: string): Promise<HabitLog[]> {
    return this.logRepo.find({ where: { habitId }, order: { completedOn: 'DESC' } });
  }

  findLogByDate(habitId: string, completedOn: string): Promise<HabitLog | null> {
    return this.logRepo.findOne({ where: { habitId, completedOn } });
  }

  createLog(data: Partial<HabitLog>): HabitLog {
    return this.logRepo.create(data);
  }

  saveLog(log: HabitLog): Promise<HabitLog> {
    return this.logRepo.save(log);
  }

  async deleteLog(habitId: string, completedOn: string): Promise<void> {
    await this.logRepo.delete({ habitId, completedOn });
  }
}
