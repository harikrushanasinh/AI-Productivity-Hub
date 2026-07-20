import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../src/modules/ai/services/ai.service';
import { AiProviderService } from '../src/core/ai/ai-provider.service';
import { AiRepository } from '../src/modules/ai/repositories/ai.repository';
import { TasksService } from '../src/modules/tasks/services/tasks.service';
import { CalendarService } from '../src/modules/calendar/services/calendar.service';
import { NotesService } from '../src/modules/notes/services/notes.service';
import { BookmarksService } from '../src/modules/bookmarks/services/bookmarks.service';
import { RewriteTone } from '../src/modules/ai/dto/rewrite-text.dto';
import { ChatRole } from '../src/modules/ai/entities/ai-message.entity';

describe('AiService', () => {
  let service: AiService;
  let provider: jest.Mocked<AiProviderService>;
  let repository: jest.Mocked<AiRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: AiProviderService, useValue: { complete: jest.fn(), completeWithImage: jest.fn() } },
        {
          provide: AiRepository,
          useValue: {
            createConversation: jest.fn(),
            saveConversation: jest.fn(),
            findConversationById: jest.fn(),
            findMessages: jest.fn(),
            createMessage: jest.fn(),
            saveMessage: jest.fn(),
          },
        },
        { provide: TasksService, useValue: { list: jest.fn() } },
        { provide: CalendarService, useValue: { list: jest.fn() } },
        { provide: NotesService, useValue: { list: jest.fn() } },
        { provide: BookmarksService, useValue: { list: jest.fn() } },
      ],
    }).compile();

    service = module.get(AiService);
    provider = module.get(AiProviderService);
    repository = module.get(AiRepository);
  });

  it('rewrite() sends the requested tone in the prompt and returns the provider result', async () => {
    provider.complete.mockResolvedValue('Rewritten text.');

    const result = await service.rewrite({ text: 'hey whats up', tone: RewriteTone.PROFESSIONAL });

    expect(result).toEqual({ result: 'Rewritten text.' });
    expect(provider.complete).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ content: expect.stringContaining('professional') }),
      ]),
    );
  });

  it('chat() persists the user message even before the provider call resolves', async () => {
    const newConversation = { id: 'conv-1', ownerId: 'user-1' };
    repository.createConversation.mockReturnValue(newConversation as any);
    repository.saveConversation.mockResolvedValue(newConversation as any);
    repository.findMessages.mockResolvedValue([]);
    repository.createMessage.mockImplementation((data) => data as any);
    repository.saveMessage.mockResolvedValue({ id: 'msg-1', role: ChatRole.ASSISTANT, content: 'Hi!' } as any);
    provider.complete.mockResolvedValue('Hi!');

    await service.chat('user-1', 'Hello there');

    expect(repository.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: ChatRole.USER, content: 'Hello there' }),
    );
  });
});
