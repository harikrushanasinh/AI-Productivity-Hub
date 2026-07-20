import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { AiRepository } from './repositories/ai.repository';
import { TasksModule } from '../tasks/tasks.module';
import { CalendarModule } from '../calendar/calendar.module';
import { NotesModule } from '../notes/notes.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversation, AiMessage]),
    // Reused for Daily Planner (Tasks + Calendar) and Smart Search (Notes + Bookmarks + Tasks).
    TasksModule,
    CalendarModule,
    NotesModule,
    BookmarksModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiRepository],
  exports: [AiService],
})
export class AiModule {}
