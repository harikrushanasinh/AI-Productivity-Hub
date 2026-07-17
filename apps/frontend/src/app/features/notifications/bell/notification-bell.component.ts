import { Component, OnDestroy, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsApiService } from '../services/notifications-api.service';
import { NotificationsSocketService } from '../services/notifications-socket.service';
import { AppNotification } from '../models/notification.model';

@Component({
  selector: 'aph-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly isOpen = signal(false);
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);

  constructor(
    private readonly notificationsApi: NotificationsApiService,
    private readonly socket: NotificationsSocketService,
  ) {
    // Whenever the socket pushes a fresh notification, prepend it and bump the badge.
    effect(() => {
      const incoming = this.socket.latestNotification();
      if (incoming) {
        this.notifications.update((list) => [incoming, ...list]);
        this.unreadCount.update((count) => count + 1);
      }
    });
  }

  ngOnInit(): void {
    this.socket.connect();
    this.refresh();
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }

  refresh(): void {
    this.notificationsApi.list().subscribe((list) => this.notifications.set(list));
    this.notificationsApi.unreadCount().subscribe((count) => this.unreadCount.set(count));
  }

  toggleOpen(): void {
    this.isOpen.update((open) => !open);
  }

  markRead(notification: AppNotification): void {
    if (notification.isRead) return;
    this.notificationsApi.markRead(notification.id).subscribe(() => {
      notification.isRead = true;
      this.unreadCount.update((count) => Math.max(0, count - 1));
    });
  }

  markAllRead(): void {
    this.notificationsApi.markAllRead().subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
      this.unreadCount.set(0);
    });
  }

  trackByNotificationId(_index: number, notification: AppNotification): string {
    return notification.id;
  }
}
