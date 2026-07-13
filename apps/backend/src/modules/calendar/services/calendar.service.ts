import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CalendarRepository } from '../repositories/calendar.repository';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { QueryEventsDto } from '../dto/query-events.dto';
import { CalendarEvent } from '../entities/event.entity';

@Injectable()
export class CalendarService {
  constructor(private readonly calendarRepository: CalendarRepository) {}

  list(ownerId: string, query: QueryEventsDto): Promise<CalendarEvent[]> {
    return this.calendarRepository.findInRange(ownerId, query.from, query.to);
  }

  async findOne(id: string, ownerId: string): Promise<CalendarEvent> {
    const event = await this.calendarRepository.findById(id, ownerId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async create(ownerId: string, dto: CreateEventDto): Promise<CalendarEvent> {
    this.assertValidRange(dto.startAt, dto.endAt);
    const event = this.calendarRepository.create({
      ...dto,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      ownerId,
      createdBy: ownerId,
    });
    return this.calendarRepository.save(event);
  }

  async update(id: string, ownerId: string, dto: UpdateEventDto): Promise<CalendarEvent> {
    const event = await this.findOne(id, ownerId);

    const nextStart = dto.startAt ?? event.startAt.toISOString();
    const nextEnd = dto.endAt ?? event.endAt.toISOString();
    this.assertValidRange(nextStart, nextEnd);

    Object.assign(event, dto, {
      startAt: new Date(nextStart),
      endAt: new Date(nextEnd),
      updatedBy: ownerId,
    });
    return this.calendarRepository.save(event);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOne(id, ownerId);
    await this.calendarRepository.softDelete(id);
  }

  private assertValidRange(startAt: string, endAt: string): void {
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      throw new BadRequestException('endAt must be after startAt');
    }
  }
}
