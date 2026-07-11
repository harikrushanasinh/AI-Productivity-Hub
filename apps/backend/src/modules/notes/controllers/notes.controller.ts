import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotesService } from '../services/notes.service';
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { QueryNotesDto } from '../dto/query-notes.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'List notes (paginated, filterable, sortable)' })
  list(@CurrentUser('userId') userId: string, @Query() query: QueryNotesDto) {
    return this.notesService.list(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single note by id' })
  findOne(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a note' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateNoteDto) {
    return this.notesService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, userId, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a note' })
  archive(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.archive(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a note' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.remove(id, userId);
  }
}
