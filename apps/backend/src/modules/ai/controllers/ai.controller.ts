import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from '../services/ai.service';
import { ChatMessageDto } from '../dto/chat-message.dto';
import { RewriteTextDto } from '../dto/rewrite-text.dto';
import { WriteEmailDto } from '../dto/write-email.dto';
import { SummarizeMeetingDto } from '../dto/summarize-meeting.dto';
import { GenerateCodeDto } from '../dto/generate-code.dto';
import { DailyPlannerDto } from '../dto/daily-planner.dto';
import { OcrImageDto } from '../dto/ocr-image.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

// AI calls are slower and more expensive than normal CRUD — a tighter,
// independent rate limit protects against runaway API cost from a single user.
const AI_THROTTLE = { default: { limit: 20, ttl: 60_000 } };

@ApiTags('ai')
@ApiBearerAuth()
@Throttle(AI_THROTTLE)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ---- AI Chat ----

  @Get('chat/conversations')
  @ApiOperation({ summary: 'List the current user\'s AI chat conversations' })
  listConversations(@CurrentUser('userId') userId: string) {
    return this.aiService.listConversations(userId);
  }

  @Get('chat/conversations/:id/messages')
  @ApiOperation({ summary: 'Get all messages in a conversation' })
  getMessages(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.aiService.getMessages(id, userId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send a chat message (creates a new conversation if none given)' })
  chat(@CurrentUser('userId') userId: string, @Body() dto: ChatMessageDto) {
    return this.aiService.chat(userId, dto.message, dto.conversationId);
  }

  // ---- Feature endpoints ----

  @Post('rewrite')
  @ApiOperation({ summary: 'Rewrite text in a chosen tone' })
  rewrite(@Body() dto: RewriteTextDto) {
    return this.aiService.rewrite(dto);
  }

  @Post('email-writer')
  @ApiOperation({ summary: 'Draft a complete email from a short intent description' })
  writeEmail(@Body() dto: WriteEmailDto) {
    return this.aiService.writeEmail(dto);
  }

  @Post('meeting-summary')
  @ApiOperation({ summary: 'Summarize a meeting transcript into decisions + action items' })
  summarizeMeeting(@Body() dto: SummarizeMeetingDto) {
    return this.aiService.summarizeMeeting(dto);
  }

  @Post('code-generator')
  @ApiOperation({ summary: 'Generate a code snippet from a natural-language description' })
  generateCode(@Body() dto: GenerateCodeDto) {
    return this.aiService.generateCode(dto);
  }

  @Post('daily-planner')
  @ApiOperation({ summary: "Draft a time-blocked plan from the user's open tasks + today's events" })
  planDay(@CurrentUser('userId') userId: string, @Body() dto: DailyPlannerDto) {
    return this.aiService.planDay(userId, dto.notes);
  }

  @Post('smart-reminder')
  @ApiOperation({ summary: 'Suggest when to be reminded about a task' })
  suggestReminder(@Body('taskDescription') taskDescription: string) {
    return this.aiService.suggestReminder(taskDescription);
  }

  @Post('ocr')
  @ApiOperation({ summary: 'Extract text from an image (vision-based OCR)' })
  ocr(@Body() dto: OcrImageDto) {
    return this.aiService.extractTextFromImage(dto.base64Image, dto.mediaType);
  }

  @Get('smart-search')
  @ApiOperation({ summary: 'Search notes, tasks, and bookmarks in one query' })
  smartSearch(@CurrentUser('userId') userId: string, @Query('q') query: string) {
    return this.aiService.smartSearch(userId, query);
  }
}
