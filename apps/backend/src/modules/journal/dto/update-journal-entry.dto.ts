import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateJournalEntryDto } from './create-journal-entry.dto';

// entryDate is immutable after creation — a journal entry belongs to the day it was written.
export class UpdateJournalEntryDto extends PartialType(
  OmitType(CreateJournalEntryDto, ['entryDate'] as const),
) {}
