import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotesRepository } from '../repositories/notes.repository';
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { QueryNotesDto } from '../dto/query-notes.dto';
import { Note } from '../entities/note.entity';

@Injectable()
export class NotesService {
  constructor(private readonly notesRepository: NotesRepository) {}

  async list(ownerId: string, query: QueryNotesDto) {
    const [items, total] = await this.notesRepository.findAndPaginate(ownerId, query);
    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string, ownerId: string): Promise<Note> {
    const note = await this.notesRepository.findById(id, ownerId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async create(ownerId: string, dto: CreateNoteDto): Promise<Note> {
    const note = this.notesRepository.create({
      ...dto,
      ownerId,
      createdBy: ownerId,
    });
    return this.notesRepository.save(note);
  }

  async update(id: string, ownerId: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.findOne(id, ownerId);
    Object.assign(note, dto, { updatedBy: ownerId });
    return this.notesRepository.save(note);
  }

  async archive(id: string, ownerId: string): Promise<Note> {
    const note = await this.findOne(id, ownerId);
    note.isArchived = true;
    return this.notesRepository.save(note);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    // Ensures ownership before allowing delete (defense in depth beyond the WHERE clause).
    const note = await this.findOne(id, ownerId);
    if (note.ownerId !== ownerId) {
      throw new ForbiddenException();
    }
    await this.notesRepository.softDelete(id);
  }
}
