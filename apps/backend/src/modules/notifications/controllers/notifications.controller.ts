import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's notifications (most recent 50)" })
  list(@CurrentUser('userId') userId: string) {
    return this.notificationsService.list(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count (for a badge indicator)' })
  unreadCount(@CurrentUser('userId') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a notification (typically called internally by other modules)' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  markRead(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(id, userId);
  }
}
