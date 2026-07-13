import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalController } from './controllers/journal.controller';
import { JournalService } from './services/journal.service';
import { JournalRepository } from './repositories/journal.repository';

@Module({
  imports: [TypeOrmModule.forFeature([JournalEntry])],
  controllers: [JournalController],
  providers: [JournalService, JournalRepository],
  exports: [JournalService],
})
export class JournalModule {}
