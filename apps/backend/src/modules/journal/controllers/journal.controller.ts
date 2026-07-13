import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JournalService } from '../services/journal.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { QueryJournalDto } from '../dto/query-journal.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('journal')
@ApiBearerAuth()
@Controller('journal/entries')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  @ApiOperation({ summary: 'List journal entries (paginated, optional date range)' })
  list(@CurrentUser('userId') userId: string, @Query() query: QueryJournalDto) {
    return this.journalService.list(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single journal entry' })
  findOne(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.journalService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a journal entry (one per calendar day)' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateJournalEntryDto) {
    return this.journalService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.journalService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a journal entry' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.journalService.remove(id, userId);
  }
}
