import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GoalsService } from '../services/goals.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { CreateMilestoneDto } from '../dto/create-milestone.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List goals with milestone-derived progress' })
  list(@CurrentUser('userId') userId: string) {
    return this.goalsService.list(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single goal with its milestones' })
  findOne(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a goal' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal (status, progress, details)' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a goal' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.remove(id, userId);
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Add a milestone to a goal' })
  addMilestone(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.goalsService.addMilestone(id, userId, dto);
  }

  @Patch(':id/milestones/:milestoneId/toggle')
  @ApiOperation({ summary: 'Toggle a milestone done/not-done' })
  toggleMilestone(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.goalsService.toggleMilestone(id, milestoneId, userId);
  }

  @Delete(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Remove a milestone' })
  removeMilestone(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.goalsService.removeMilestone(id, milestoneId, userId);
  }
}
