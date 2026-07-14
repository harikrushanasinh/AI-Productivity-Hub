import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HabitsService } from '../services/habits.service';
import { CreateHabitDto } from '../dto/create-habit.dto';
import { UpdateHabitDto } from '../dto/update-habit.dto';
import { LogHabitDto } from '../dto/log-habit.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('habits')
@ApiBearerAuth()
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  @ApiOperation({ summary: 'List habits with current/longest streak and today status' })
  list(@CurrentUser('userId') userId: string) {
    return this.habitsService.list(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single habit' })
  findOne(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.habitsService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a habit' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a habit' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(id, userId, dto);
  }

  @Post(':id/log')
  @ApiOperation({ summary: "Check in a habit for today (or a given date)" })
  log(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LogHabitDto,
  ) {
    return this.habitsService.logCompletion(id, userId, dto);
  }

  @Delete(':id/log')
  @ApiOperation({ summary: 'Remove a check-in for today (or a given date)' })
  unlog(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('completedOn') completedOn?: string,
  ) {
    return this.habitsService.unlogCompletion(id, userId, completedOn);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a habit' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.habitsService.remove(id, userId);
  }
}
