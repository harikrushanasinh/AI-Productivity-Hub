import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FocusRepository } from '../repositories/focus.repository';
import { StartSessionDto } from '../dto/start-session.dto';
import { CompleteSessionDto } from '../dto/complete-session.dto';
import {
  FocusSession,
  FocusSessionStatus,
  FocusSessionType,
} from '../entities/focus-session.entity';

@Injectable()
export class FocusService {
  constructor(private readonly focusRepository: FocusRepository) {}

  history(ownerId: string): Promise<FocusSession[]> {
    return this.focusRepository.findHistory(ownerId);
  }

  async todayStats(ownerId: string) {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const totalSeconds = await this.focusRepository.totalFocusedSecondsToday(
      ownerId,
      dayStart,
      dayEnd,
    );

    return {
      totalFocusedSeconds: totalSeconds,
      totalFocusedMinutes: Math.round(totalSeconds / 60),
    };
  }

  start(ownerId: string, dto: StartSessionDto): Promise<FocusSession> {
    const session = this.focusRepository.create({
      ownerId,
      taskId: dto.taskId ?? null,
      type: dto.type ?? FocusSessionType.WORK,
      plannedMinutes: dto.plannedMinutes ?? 25,
      startedAt: new Date(),
      status: FocusSessionStatus.RUNNING,
      createdBy: ownerId,
    });
    return this.focusRepository.save(session);
  }

  async complete(id: string, ownerId: string, dto: CompleteSessionDto): Promise<FocusSession> {
    const session = await this.focusRepository.findById(id, ownerId);
    if (!session) {
      throw new NotFoundException('Focus session not found');
    }
    if (session.status !== FocusSessionStatus.RUNNING) {
      throw new BadRequestException('Session has already been completed or interrupted');
    }

    session.actualSeconds = dto.actualSeconds;
    session.endedAt = new Date();
    session.status = dto.interrupted
      ? FocusSessionStatus.INTERRUPTED
      : FocusSessionStatus.COMPLETED;
    session.updatedBy = ownerId;

    return this.focusRepository.save(session);
  }
}
