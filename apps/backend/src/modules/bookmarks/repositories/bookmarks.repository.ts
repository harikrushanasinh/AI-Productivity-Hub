import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from '../entities/bookmark.entity';
import { QueryBookmarksDto } from '../dto/query-bookmarks.dto';

@Injectable()
export class BookmarksRepository {
  constructor(
    @InjectRepository(Bookmark)
    private readonly repo: Repository<Bookmark>,
  ) {}

  findAll(ownerId: string, query: QueryBookmarksDto): Promise<Bookmark[]> {
    const qb = this.repo
      .createQueryBuilder('bookmark')
      .where('bookmark.ownerId = :ownerId', { ownerId });

    if (query.search) {
      qb.andWhere('(bookmark.title ILIKE :search OR bookmark.url ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.folder) {
      qb.andWhere('bookmark.folder = :folder', { folder: query.folder });
    }
    if (query.tag) {
      qb.andWhere('bookmark.tags ILIKE :tag', { tag: `%${query.tag}%` });
    }

    return qb.orderBy('bookmark.isFavorite', 'DESC').addOrderBy('bookmark.createdAt', 'DESC').getMany();
  }

  findById(id: string, ownerId: string): Promise<Bookmark | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<Bookmark>): Bookmark {
    return this.repo.create(data);
  }

  save(bookmark: Bookmark): Promise<Bookmark> {
    return this.repo.save(bookmark);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
