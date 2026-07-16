import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookmarksApiService } from '../services/bookmarks-api.service';
import { Bookmark } from '../models/bookmark.model';

@Component({
  selector: 'aph-bookmarks-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookmarks-list.component.html',
  styleUrl: './bookmarks-list.component.scss',
})
export class BookmarksListComponent implements OnInit {
  readonly bookmarks = signal<Bookmark[]>([]);
  readonly loading = signal(true);
  readonly searchTerm = signal('');
  readonly newUrl = signal('');
  readonly newTitle = signal('');
  readonly errorMessage = signal<string | null>(null);

  constructor(private readonly bookmarksApi: BookmarksApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.bookmarksApi.list(this.searchTerm() || undefined).subscribe({
      next: (bookmarks) => {
        this.bookmarks.set(bookmarks);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createBookmark(): void {
    const url = this.newUrl().trim();
    const title = this.newTitle().trim();
    if (!url || !title) return;

    this.errorMessage.set(null);
    this.bookmarksApi.create({ url, title }).subscribe({
      next: () => {
        this.newUrl.set('');
        this.newTitle.set('');
        this.refresh();
      },
      error: () => this.errorMessage.set('Please enter a valid URL (including https://).'),
    });
  }

  toggleFavorite(bookmark: Bookmark): void {
    this.bookmarksApi.toggleFavorite(bookmark.id, !bookmark.isFavorite).subscribe(() => this.refresh());
  }

  deleteBookmark(id: string): void {
    this.bookmarksApi.remove(id).subscribe(() => this.refresh());
  }

  trackByBookmarkId(_index: number, bookmark: Bookmark): string {
    return bookmark.id;
  }
}
