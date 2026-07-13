import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CalendarService } from '../services/calendar.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { QueryEventsDto } from '../dto/query-events.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('calendar')
@ApiBearerAuth()
@Controller('calendar/events')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'List events, optionally filtered by date range (from/to)' })
  list(@CurrentUser('userId') userId: string, @Query() query: QueryEventsDto) {
    return this.calendarService.list(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event' })
  findOne(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.calendarService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an event' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateEventDto) {
    return this.calendarService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.calendarService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an event' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.calendarService.remove(id, userId);
  }
}
