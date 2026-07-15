import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FocusService } from '../services/focus.service';
import { StartSessionDto } from '../dto/start-session.dto';
import { CompleteSessionDto } from '../dto/complete-session.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('focus')
@ApiBearerAuth()
@Controller('focus/sessions')
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  @Get()
  @ApiOperation({ summary: 'Recent focus session history' })
  history(@CurrentUser('userId') userId: string) {
    return this.focusService.history(userId);
  }

  @Get('stats/today')
  @ApiOperation({ summary: "Today's total focused time" })
  todayStats(@CurrentUser('userId') userId: string) {
    return this.focusService.todayStats(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Start a new focus session' })
  start(@CurrentUser('userId') userId: string, @Body() dto: StartSessionDto) {
    return this.focusService.start(userId, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a session complete or interrupted' })
  complete(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.focusService.complete(id, userId, dto);
  }
}
