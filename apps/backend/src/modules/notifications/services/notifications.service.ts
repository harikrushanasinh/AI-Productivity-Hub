import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  list(ownerId: string): Promise<Notification[]> {
    return this.notificationsRepository.findAllByOwner(ownerId);
  }

  async unreadCount(ownerId: string): Promise<{ count: number }> {
    const count = await this.notificationsRepository.countUnread(ownerId);
    return { count };
  }

  /**
   * The main entry point other modules should call to notify a user
   * (e.g. `notificationsService.create({ ownerId, title: 'Task due soon', ... })`).
   * Persists the row AND pushes it live over the WebSocket gateway in one call.
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(dto);
    const saved = await this.notificationsRepository.save(notification);
    this.gateway.emitToUser(dto.ownerId, saved);
    return saved;
  }

  async markRead(id: string, ownerId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findById(id, ownerId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllRead(ownerId: string): Promise<void> {
    await this.notificationsRepository.markAllRead(ownerId);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const notification = await this.notificationsRepository.findById(id, ownerId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    await this.notificationsRepository.softDelete(id);
  }
}
