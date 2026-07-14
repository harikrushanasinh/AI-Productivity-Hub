import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { HabitsRepository } from '../repositories/habits.repository';
import { CreateHabitDto } from '../dto/create-habit.dto';
import { UpdateHabitDto } from '../dto/update-habit.dto';
import { LogHabitDto } from '../dto/log-habit.dto';
import { Habit } from '../entities/habit.entity';

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
}

@Injectable()
export class HabitsService {
  constructor(private readonly habitsRepository: HabitsRepository) {}

  async list(ownerId: string): Promise<HabitWithStats[]> {
    const habits = await this.habitsRepository.findAllByOwner(ownerId);
    return Promise.all(habits.map((habit) => this.withStats(habit)));
  }

  async findOne(id: string, ownerId: string): Promise<Habit> {
    const habit = await this.habitsRepository.findById(id, ownerId);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  create(ownerId: string, dto: CreateHabitDto): Promise<Habit> {
    const habit = this.habitsRepository.create({ ...dto, ownerId, createdBy: ownerId });
    return this.habitsRepository.save(habit);
  }

  async update(id: string, ownerId: string, dto: UpdateHabitDto): Promise<Habit> {
    const habit = await this.findOne(id, ownerId);
    Object.assign(habit, dto, { updatedBy: ownerId });
    return this.habitsRepository.save(habit);
  }

  async archive(id: string, ownerId: string): Promise<Habit> {
    const habit = await this.findOne(id, ownerId);
    habit.isArchived = true;
    return this.habitsRepository.save(habit);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOne(id, ownerId);
    await this.habitsRepository.softDelete(id);
  }

  /** Toggle today's (or a given date's) check-in for a habit. */
  async logCompletion(habitId: string, ownerId: string, dto: LogHabitDto) {
    await this.findOne(habitId, ownerId); // ensures ownership
    const completedOn = dto.completedOn ?? this.todayIso();

    const existing = await this.habitsRepository.findLogByDate(habitId, completedOn);
    if (existing) {
      throw new ConflictException('Already logged for this date');
    }

    const log = this.habitsRepository.createLog({
      habitId,
      ownerId,
      completedOn,
      note: dto.note ?? null,
      createdBy: ownerId,
    });
    return this.habitsRepository.saveLog(log);
  }

  async unlogCompletion(habitId: string, ownerId: string, completedOn?: string): Promise<void> {
    await this.findOne(habitId, ownerId);
    await this.habitsRepository.deleteLog(habitId, completedOn ?? this.todayIso());
  }

  private async withStats(habit: Habit): Promise<HabitWithStats> {
    const logs = await this.habitsRepository.findLogsForHabit(habit.id);
    const completedDates = new Set(logs.map((l) => l.completedOn));
    const today = this.todayIso();

    const { currentStreak, longestStreak } = this.computeStreaks(completedDates, today);

    return {
      ...habit,
      currentStreak,
      longestStreak,
      completedToday: completedDates.has(today),
    };
  }

  /**
   * Computes current and longest daily streaks from a set of completed ISO dates.
   * "Current streak" tolerates today being not-yet-logged (it still counts
   * yesterday's streak as current) but breaks the moment a day is actually missed.
   */
  private computeStreaks(
    completedDates: Set<string>,
    today: string,
  ): { currentStreak: number; longestStreak: number } {
    if (completedDates.size === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const sorted = Array.from(completedDates).sort();
    let longestStreak = 1;
    let running = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const dayDiff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
      running = dayDiff === 1 ? running + 1 : 1;
      longestStreak = Math.max(longestStreak, running);
    }

    // Walk backwards from today (or yesterday, if today isn't logged yet).
    let cursor = new Date(today);
    if (!completedDates.has(today)) {
      cursor = new Date(cursor.getTime() - 86_400_000);
    }

    let currentStreak = 0;
    while (completedDates.has(cursor.toISOString().slice(0, 10))) {
      currentStreak += 1;
      cursor = new Date(cursor.getTime() - 86_400_000);
    }

    return { currentStreak, longestStreak };
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
