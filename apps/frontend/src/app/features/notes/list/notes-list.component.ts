import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesApiService } from '../services/notes-api.service';
import { Note } from '../models/note.model';

@Component({
  selector: 'aph-notes-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.scss',
})
export class NotesListComponent implements OnInit {
  readonly notes = signal<Note[]>([]);
  readonly loading = signal(true);
  readonly newTitle = signal('');

  constructor(private readonly notesApi: NotesApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.notesApi.list().subscribe({
      next: (res) => {
        this.notes.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createNote(): void {
    const title = this.newTitle().trim();
    if (!title) return;

    this.notesApi.create({ title }).subscribe(() => {
      this.newTitle.set('');
      this.refresh();
    });
  }

  deleteNote(id: string): void {
    this.notesApi.remove(id).subscribe(() => this.refresh());
  }

  // Prevents Angular from re-rendering unchanged rows on every refresh.
  trackByNoteId(_index: number, note: Note): string {
    return note.id;
  }
}
