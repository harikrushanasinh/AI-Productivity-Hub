import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FocusSession } from '../entities/focus-session.entity';

@Injectable()
export class FocusRepository {
  constructor(
    @InjectRepository(FocusSession)
    private readonly repo: Repository<FocusSession>,
  ) {}

  findHistory(ownerId: string, limit = 50): Promise<FocusSession[]> {
    return this.repo.find({
      where: { ownerId },
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  findById(id: string, ownerId: string): Promise<FocusSession | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<FocusSession>): FocusSession {
    return this.repo.create(data);
  }

  save(session: FocusSession): Promise<FocusSession> {
    return this.repo.save(session);
  }

  /** Sum of completed WORK-session seconds for a given day — powers the "today" stat. */
  async totalFocusedSecondsToday(ownerId: string, dayStart: Date, dayEnd: Date): Promise<number> {
    const { total } = await this.repo
      .createQueryBuilder('session')
      .select('COALESCE(SUM(session.actualSeconds), 0)', 'total')
      .where('session.ownerId = :ownerId', { ownerId })
      .andWhere('session.type = :type', { type: 'work' })
      .andWhere('session.startedAt >= :dayStart', { dayStart })
      .andWhere('session.startedAt < :dayEnd', { dayEnd })
      .getRawOne();

    return Number(total);
  }
}
