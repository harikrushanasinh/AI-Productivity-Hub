import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VaultApiService } from '../services/vault-api.service';
import { VaultItemSummary } from '../models/vault-item.model';

const AUTO_HIDE_MS = 15_000; // revealed secrets hide themselves after 15s

@Component({
  selector: 'aph-vault-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vault-list.component.html',
  styleUrl: './vault-list.component.scss',
})
export class VaultListComponent implements OnInit, OnDestroy {
  readonly items = signal<VaultItemSummary[]>([]);
  readonly loading = signal(true);
  readonly revealedPasswords = signal<Record<string, string>>({});

  readonly newTitle = signal('');
  readonly newUsername = signal('');
  readonly newPassword = signal('');

  private hideTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  constructor(private readonly vaultApi: VaultApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    Object.values(this.hideTimers).forEach(clearTimeout);
  }

  refresh(): void {
    this.loading.set(true);
    this.vaultApi.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createItem(): void {
    const title = this.newTitle().trim();
    const password = this.newPassword();
    if (!title || !password) return;

    this.vaultApi
      .create({ title, username: this.newUsername().trim() || undefined, password })
      .subscribe(() => {
        this.newTitle.set('');
        this.newUsername.set('');
        this.newPassword.set('');
        this.refresh();
      });
  }

  isRevealed(id: string): boolean {
    return id in this.revealedPasswords();
  }

  revealedValue(id: string): string {
    return this.revealedPasswords()[id] ?? '';
  }

  toggleReveal(id: string): void {
    if (this.isRevealed(id)) {
      this.hidePassword(id);
      return;
    }

    this.vaultApi.reveal(id).subscribe((secret) => {
      this.revealedPasswords.update((map) => ({ ...map, [id]: secret.password }));
      // Auto-hide after a short window so a revealed secret doesn't linger on screen.
      this.hideTimers[id] = setTimeout(() => this.hidePassword(id), AUTO_HIDE_MS);
    });
  }

  private hidePassword(id: string): void {
    this.revealedPasswords.update((map) => {
      const next = { ...map };
      delete next[id];
      return next;
    });
    if (this.hideTimers[id]) {
      clearTimeout(this.hideTimers[id]);
      delete this.hideTimers[id];
    }
  }

  deleteItem(id: string): void {
    this.vaultApi.remove(id).subscribe(() => this.refresh());
  }

  trackByItemId(_index: number, item: VaultItemSummary): string {
    return item.id;
  }
}
