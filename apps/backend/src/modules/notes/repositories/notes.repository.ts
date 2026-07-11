import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from '../entities/note.entity';
import { QueryNotesDto } from '../dto/query-notes.dto';

/**
 * Repository layer isolates all TypeORM/query-builder specifics from the
 * service layer (Clean Architecture: service depends on this abstraction,
 * not on TypeORM directly), making it easy to swap persistence later.
 */
@Injectable()
export class NotesRepository {
  constructor(
    @InjectRepository(Note)
    private readonly repo: Repository<Note>,
  ) {}

  async findAndPaginate(
    ownerId: string,
    query: QueryNotesDto,
  ): Promise<[Note[], number]> {
    const qb = this.repo
      .createQueryBuilder('note')
      .where('note.ownerId = :ownerId', { ownerId });

    if (query.search) {
      qb.andWhere('(note.title ILIKE :search OR note.content ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.isPinned !== undefined) {
      qb.andWhere('note.isPinned = :isPinned', { isPinned: query.isPinned });
    }
    if (query.isArchived !== undefined) {
      qb.andWhere('note.isArchived = :isArchived', { isArchived: query.isArchived });
    }

    qb.orderBy(`note.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    return qb.getManyAndCount();
  }

  findById(id: string, ownerId: string): Promise<Note | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<Note>): Note {
    return this.repo.create(data);
  }

  save(note: Note): Promise<Note> {
    return this.repo.save(note);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
