import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntry } from '../entities/journal-entry.entity';
import { QueryJournalDto } from '../dto/query-journal.dto';

@Injectable()
export class JournalRepository {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly repo: Repository<JournalEntry>,
  ) {}

  async findAndPaginate(ownerId: string, query: QueryJournalDto): Promise<[JournalEntry[], number]> {
    const qb = this.repo
      .createQueryBuilder('entry')
      .where('entry.ownerId = :ownerId', { ownerId });

    if (query.from) {
      qb.andWhere('entry.entryDate >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('entry.entryDate <= :to', { to: query.to });
    }

    qb.orderBy('entry.entryDate', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    return qb.getManyAndCount();
  }

  findByDate(ownerId: string, entryDate: string): Promise<JournalEntry | null> {
    return this.repo.findOne({ where: { ownerId, entryDate } });
  }

  findById(id: string, ownerId: string): Promise<JournalEntry | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<JournalEntry>): JournalEntry {
    return this.repo.create(data);
  }

  save(entry: JournalEntry): Promise<JournalEntry> {
    return this.repo.save(entry);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
