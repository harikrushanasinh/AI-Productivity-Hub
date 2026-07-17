import { Injectable, OnDestroy, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { AppNotification } from '../models/notification.model';

/**
 * Maintains a live Socket.IO connection to the /notifications namespace and
 * exposes newly-pushed notifications as a signal. The REST API
 * (NotificationsApiService) remains the source of truth for history/read-state;
 * this service only handles the real-time "push" side.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsSocketService implements OnDestroy {
  readonly latestNotification = signal<AppNotification | null>(null);

  private socket: Socket | null = null;

  constructor(private readonly authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.socket = io(`${environment.wsUrl}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('notification', (notification: AppNotification) => {
      this.latestNotification.set(notification);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
