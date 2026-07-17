import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  findAllByOwner(ownerId: string, limit = 50): Promise<Notification[]> {
    return this.repo.find({ where: { ownerId }, order: { createdAt: 'DESC' }, take: limit });
  }

  findById(id: string, ownerId: string): Promise<Notification | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  countUnread(ownerId: string): Promise<number> {
    return this.repo.count({ where: { ownerId, isRead: false } });
  }

  create(data: Partial<Notification>): Notification {
    return this.repo.create(data);
  }

  save(notification: Notification): Promise<Notification> {
    return this.repo.save(notification);
  }

  async markAllRead(ownerId: string): Promise<void> {
    await this.repo.update({ ownerId, isRead: false }, { isRead: true });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
