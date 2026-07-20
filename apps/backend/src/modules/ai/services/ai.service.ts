import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AiProviderService } from '../../../core/ai/ai-provider.service';
import { AiRepository } from '../repositories/ai.repository';
import { TasksService } from '../../tasks/services/tasks.service';
import { CalendarService } from '../../calendar/services/calendar.service';
import { NotesService } from '../../notes/services/notes.service';
import { BookmarksService } from '../../bookmarks/services/bookmarks.service';
import { RewriteTextDto, RewriteTone } from '../dto/rewrite-text.dto';
import { WriteEmailDto } from '../dto/write-email.dto';
import { SummarizeMeetingDto } from '../dto/summarize-meeting.dto';
import { GenerateCodeDto } from '../dto/generate-code.dto';
import { ChatRole } from '../entities/ai-message.entity';

const SYSTEM_PROMPTS = {
  chat:
    'You are the AI Assistant inside AI Productivity Hub, a productivity SaaS app. ' +
    'Be concise, helpful, and practical. You can discuss the user\'s notes, tasks, ' +
    'goals, habits, and schedule if they mention them, but you do not have live ' +
    'access to that data unless it is included in the conversation.',
  rewrite:
    'You rewrite text in a requested tone while preserving the original meaning and ' +
    'key facts. Return ONLY the rewritten text, no preamble, no explanation.',
  email:
    'You draft complete, ready-to-send emails from a short description of intent. ' +
    'Include a subject line on the first line prefixed with "Subject: ", then a blank ' +
    'line, then the email body. Do not add any commentary outside the email itself.',
  meetingSummary:
    'You summarize meeting transcripts into: a 2-3 sentence overview, a bulleted list ' +
    'of key decisions, and a bulleted list of action items (with owners if mentioned). ' +
    'Use clear markdown headers for each section.',
  codeGenerator:
    'You are a senior software engineer. Generate clean, correct, well-commented code ' +
    'for the given request. Return ONLY a single code block with the code — no ' +
    'surrounding explanation unless the request explicitly asks for one.',
  dailyPlanner:
    'You are a practical daily planning assistant. Given a list of open tasks and ' +
    'today\'s calendar events, produce a realistic, time-blocked schedule for the day ' +
    'as a short markdown list. Be realistic about time — do not overpack the day.',
  smartReminder:
    'Given a task description, suggest ONE specific, practical reminder time (e.g. ' +
    '"30 minutes before", "the morning of", "2 days before") and a one-sentence ' +
    'reason. Keep the entire response under 40 words.',
} as const;

@Injectable()
export class AiService {
  constructor(
    private readonly aiProvider: AiProviderService,
    private readonly aiRepository: AiRepository,
    private readonly tasksService: TasksService,
    private readonly calendarService: CalendarService,
    private readonly notesService: NotesService,
    private readonly bookmarksService: BookmarksService,
  ) {}

  // ---- AI Chat (persisted conversation history) ----

  listConversations(ownerId: string) {
    return this.aiRepository.findConversationsByOwner(ownerId);
  }

  async getMessages(conversationId: string, ownerId: string) {
    await this.getOwnedConversation(conversationId, ownerId);
    return this.aiRepository.findMessages(conversationId);
  }

  async chat(ownerId: string, message: string, conversationId?: string) {
    const conversation = conversationId
      ? await this.getOwnedConversation(conversationId, ownerId)
      : await this.aiRepository.saveConversation(
          this.aiRepository.createConversation({
            ownerId,
            title: message.slice(0, 60),
            createdBy: ownerId,
          }),
        );

    const history = await this.aiRepository.findMessages(conversation.id);

    await this.aiRepository.saveMessage(
      this.aiRepository.createMessage({
        conversationId: conversation.id,
        role: ChatRole.USER,
        content: message,
        createdBy: ownerId,
      }),
    );

    const turns = [
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const replyText = await this.aiProvider.complete(SYSTEM_PROMPTS.chat, turns);

    const savedReply = await this.aiRepository.saveMessage(
      this.aiRepository.createMessage({
        conversationId: conversation.id,
        role: ChatRole.ASSISTANT,
        content: replyText,
        createdBy: ownerId,
      }),
    );

    conversation.updatedBy = ownerId;
    await this.aiRepository.saveConversation(conversation);

    return { conversationId: conversation.id, reply: savedReply };
  }

  // ---- Text Rewrite ----

  async rewrite(dto: RewriteTextDto): Promise<{ result: string }> {
    const tone = dto.tone ?? RewriteTone.PROFESSIONAL;
    const result = await this.aiProvider.complete(SYSTEM_PROMPTS.rewrite, [
      { role: 'user', content: `Rewrite the following text in a ${tone} tone:\n\n${dto.text}` },
    ]);
    return { result };
  }

  // ---- Email Writer ----

  async writeEmail(dto: WriteEmailDto): Promise<{ result: string }> {
    const tone = dto.tone ? ` in a ${dto.tone} tone` : '';
    const result = await this.aiProvider.complete(SYSTEM_PROMPTS.email, [
      { role: 'user', content: `Write an email${tone} for this intent:\n\n${dto.intent}` },
    ]);
    return { result };
  }

  // ---- Meeting Summary ----

  async summarizeMeeting(dto: SummarizeMeetingDto): Promise<{ result: string }> {
    const result = await this.aiProvider.complete(SYSTEM_PROMPTS.meetingSummary, [
      { role: 'user', content: dto.transcript },
    ]);
    return { result };
  }

  // ---- Code Generator ----

  async generateCode(dto: GenerateCodeDto): Promise<{ result: string }> {
    const language = dto.language ? ` in ${dto.language}` : '';
    const result = await this.aiProvider.complete(SYSTEM_PROMPTS.codeGenerator, [
      { role: 'user', content: `Write code${language} for:\n\n${dto.prompt}` },
    ]);
    return { result };
  }

  // ---- Daily Planner (pulls real Tasks + Calendar context) ----

  async planDay(ownerId: string, notes?: string): Promise<{ result: string }> {
    const [tasks, events] = await Promise.all([
      this.tasksService.list(ownerId),
      this.calendarService.list(ownerId, {}),
    ]);

    const openTasks = tasks.filter((t) => t.status !== 'done');
    const todayIso = new Date().toISOString().slice(0, 10);
    const todaysEvents = events.filter((e) => e.startAt.toISOString().startsWith(todayIso));

    const context = [
      `Open tasks:\n${openTasks.map((t) => `- ${t.title} (priority: ${t.priority})`).join('\n') || 'None'}`,
      `Today's calendar events:\n${
        todaysEvents.map((e) => `- ${e.title} at ${e.startAt.toISOString()}`).join('\n') || 'None'
      }`,
      notes ? `Additional context from the user: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = await this.aiProvider.complete(SYSTEM_PROMPTS.dailyPlanner, [
      { role: 'user', content: context },
    ]);
    return { result };
  }

  // ---- Smart Reminder ----

  async suggestReminder(taskDescription: string): Promise<{ result: string }> {
    const result = await this.aiProvider.complete(SYSTEM_PROMPTS.smartReminder, [
      { role: 'user', content: taskDescription },
    ]);
    return { result };
  }

  // ---- OCR (vision) ----

  async extractTextFromImage(base64Image: string, mediaType: string): Promise<{ result: string }> {
    const result = await this.aiProvider.completeWithImage(
      'You transcribe text visible in images exactly as written, with no commentary.',
      'Transcribe all text visible in this image. Return only the transcribed text.',
      base64Image,
      mediaType,
    );
    return { result };
  }

  // ---- Smart Search (cross-module keyword search) ----

  async smartSearch(ownerId: string, query: string) {
    const [notes, bookmarks, tasks] = await Promise.all([
      this.notesService.list(ownerId, {
        page: 1,
        limit: 10,
        search: query,
        sortBy: 'updatedAt',
        sortOrder: 'DESC',
      }),
      this.bookmarksService.list(ownerId, { search: query }),
      this.tasksService.list(ownerId),
    ]);

    const matchingTasks = tasks.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase()),
    );

    return {
      notes: notes.items.map((n) => ({ type: 'note', id: n.id, title: n.title })),
      bookmarks: bookmarks.map((b) => ({ type: 'bookmark', id: b.id, title: b.title, url: b.url })),
      tasks: matchingTasks.map((t) => ({ type: 'task', id: t.id, title: t.title })),
    };
  }

  private async getOwnedConversation(id: string, ownerId: string) {
    const conversation = await this.aiRepository.findConversationById(id, ownerId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.ownerId !== ownerId) {
      throw new ForbiddenException();
    }
    return conversation;
  }
}
