import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CalendarEvent } from '../entities/event.entity';

@Injectable()
export class CalendarRepository {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly repo: Repository<CalendarEvent>,
  ) {}

  findInRange(ownerId: string, from?: string, to?: string): Promise<CalendarEvent[]> {
    if (from && to) {
      return this.repo.find({
        where: { ownerId, startAt: Between(new Date(from), new Date(to)) },
        order: { startAt: 'ASC' },
      });
    }
    return this.repo.find({ where: { ownerId }, order: { startAt: 'ASC' } });
  }

  findById(id: string, ownerId: string): Promise<CalendarEvent | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<CalendarEvent>): CalendarEvent {
    return this.repo.create(data);
  }

  save(event: CalendarEvent): Promise<CalendarEvent> {
    return this.repo.save(event);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
