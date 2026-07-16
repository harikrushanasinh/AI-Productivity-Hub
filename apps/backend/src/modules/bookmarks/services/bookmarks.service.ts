import { Injectable, NotFoundException } from '@nestjs/common';
import { BookmarksRepository } from '../repositories/bookmarks.repository';
import { CreateBookmarkDto } from '../dto/create-bookmark.dto';
import { UpdateBookmarkDto } from '../dto/update-bookmark.dto';
import { QueryBookmarksDto } from '../dto/query-bookmarks.dto';
import { Bookmark } from '../entities/bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(private readonly bookmarksRepository: BookmarksRepository) {}

  list(ownerId: string, query: QueryBookmarksDto): Promise<Bookmark[]> {
    return this.bookmarksRepository.findAll(ownerId, query);
  }

  async findOne(id: string, ownerId: string): Promise<Bookmark> {
    const bookmark = await this.bookmarksRepository.findById(id, ownerId);
    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }
    return bookmark;
  }

  create(ownerId: string, dto: CreateBookmarkDto): Promise<Bookmark> {
    const bookmark = this.bookmarksRepository.create({
      ...dto,
      // Derive a favicon via Google's public favicon service if none provided —
      // avoids needing our own screenshot/favicon-fetching infrastructure.
      faviconUrl: `https://www.google.com/s2/favicons?domain=${new URL(dto.url).hostname}&sz=64`,
      ownerId,
      createdBy: ownerId,
    });
    return this.bookmarksRepository.save(bookmark);
  }

  async update(id: string, ownerId: string, dto: UpdateBookmarkDto): Promise<Bookmark> {
    const bookmark = await this.findOne(id, ownerId);
    Object.assign(bookmark, dto, { updatedBy: ownerId });
    return this.bookmarksRepository.save(bookmark);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOne(id, ownerId);
    await this.bookmarksRepository.softDelete(id);
  }
}
