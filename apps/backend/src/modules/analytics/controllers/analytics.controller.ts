import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Cross-module summary: tasks, expenses, habits, goals, focus time' })
  getDashboard(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getDashboard(userId);
  }
}
