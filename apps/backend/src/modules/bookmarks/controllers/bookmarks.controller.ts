import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookmarksService } from '../services/bookmarks.service';
import { CreateBookmarkDto } from '../dto/create-bookmark.dto';
import { UpdateBookmarkDto } from '../dto/update-bookmark.dto';
import { QueryBookmarksDto } from '../dto/query-bookmarks.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('bookmarks')
@ApiBearerAuth()
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @ApiOperation({ summary: 'List bookmarks (search, folder, tag filters)' })
  list(@CurrentUser('userId') userId: string, @Query() query: QueryBookmarksDto) {
    return this.bookmarksService.list(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single bookmark' })
  findOne(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookmarksService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Save a bookmark' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bookmark' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookmarkDto,
  ) {
    return this.bookmarksService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bookmark' })
  remove(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookmarksService.remove(id, userId);
  }
}
