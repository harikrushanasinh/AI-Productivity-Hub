import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalApiService } from '../services/journal-api.service';
import { JournalEntry } from '../models/journal-entry.model';

const MOOD_EMOJI: Record<number, string> = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

@Component({
  selector: 'aph-journal-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-list.component.html',
  styleUrl: './journal-list.component.scss',
})
export class JournalListComponent implements OnInit {
  readonly entries = signal<JournalEntry[]>([]);
  readonly loading = signal(true);
  readonly newContent = signal('');
  readonly newMood = signal(3);
  readonly errorMessage = signal<string | null>(null);

  readonly moodOptions = [1, 2, 3, 4, 5];
  readonly moodEmoji = MOOD_EMOJI;

  constructor(private readonly journalApi: JournalApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.journalApi.list().subscribe({
      next: (res) => {
        this.entries.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createEntry(): void {
    const content = this.newContent().trim();
    if (!content) return;

    this.errorMessage.set(null);
    const today = new Date().toISOString().slice(0, 10);

    this.journalApi.create({ entryDate: today, content, mood: this.newMood() }).subscribe({
      next: () => {
        this.newContent.set('');
        this.refresh();
      },
      error: (err) => {
        this.errorMessage.set(
          err?.status === 409 ? "You've already written an entry for today." : 'Something went wrong.',
        );
      },
    });
  }

  deleteEntry(id: string): void {
    this.journalApi.remove(id).subscribe(() => this.refresh());
  }

  trackByEntryId(_index: number, entry: JournalEntry): string {
    return entry.id;
  }
}
