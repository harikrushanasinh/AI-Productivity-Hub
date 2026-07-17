import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsGateway } from './gateways/notifications.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), ConfigModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
