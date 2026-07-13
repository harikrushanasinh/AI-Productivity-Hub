import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from '../services/expenses.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { QueryExpensesDto } from '../dto/query-expenses.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses (paginated, filterable by date/category/type)' })
  list(@CurrentUser('userId') userId: string, @Query() query: QueryExpensesDto) {
    return this.expensesService.list(userId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Income vs expense totals for a date range' })
  summary(
    @CurrentUser('userId') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.expensesService.summary(userId, from, to);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expense' })
  findOne(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an expense or income record' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an expense' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.remove(id, userId);
  }
}
