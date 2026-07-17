import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { Notification } from '../entities/notification.entity';

/**
 * Real-time notification delivery over Socket.IO. Each authenticated socket
 * joins a room named after its userId — notifications are emitted only to
 * that room, so a user only ever receives their own events (no broadcast).
 *
 * Auth: the client must connect with `{ auth: { token: '<accessToken>' } }`.
 * A socket that fails JWT verification is disconnected immediately.
 */
@Injectable()
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.['token'] as string | undefined;
      if (!token) throw new Error('Missing auth token');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('jwt.secret'),
      });

      await client.join(payload.sub);
      this.logger.debug(`Socket ${client.id} authenticated for user ${payload.sub}`);
    } catch {
      this.logger.warn(`Socket ${client.id} failed authentication — disconnecting`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Socket ${client.id} disconnected`);
  }

  /** Called by NotificationsService right after a notification is persisted. */
  emitToUser(ownerId: string, notification: Notification): void {
    this.server.to(ownerId).emit('notification', notification);
  }
}
