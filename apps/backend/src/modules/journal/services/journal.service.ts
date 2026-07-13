import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JournalRepository } from '../repositories/journal.repository';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { QueryJournalDto } from '../dto/query-journal.dto';
import { JournalEntry } from '../entities/journal-entry.entity';

@Injectable()
export class JournalService {
  constructor(private readonly journalRepository: JournalRepository) {}

  async list(ownerId: string, query: QueryJournalDto) {
    const [items, total] = await this.journalRepository.findAndPaginate(ownerId, query);
    return {
      items,
      meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async findOne(id: string, ownerId: string): Promise<JournalEntry> {
    const entry = await this.journalRepository.findById(id, ownerId);
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return entry;
  }

  async create(ownerId: string, dto: CreateJournalEntryDto): Promise<JournalEntry> {
    const existing = await this.journalRepository.findByDate(ownerId, dto.entryDate);
    if (existing) {
      throw new ConflictException('A journal entry already exists for this date');
    }

    const entry = this.journalRepository.create({ ...dto, ownerId, createdBy: ownerId });
    return this.journalRepository.save(entry);
  }

  async update(id: string, ownerId: string, dto: UpdateJournalEntryDto): Promise<JournalEntry> {
    const entry = await this.findOne(id, ownerId);
    Object.assign(entry, dto, { updatedBy: ownerId });
    return this.journalRepository.save(entry);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOne(id, ownerId);
    await this.journalRepository.softDelete(id);
  }
}
