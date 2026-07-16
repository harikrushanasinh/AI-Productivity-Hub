import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesApiService } from '../services/files-api.service';
import { FileItem, StorageStats } from '../models/file.model';

@Component({
  selector: 'aph-files-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './files-list.component.html',
  styleUrl: './files-list.component.scss',
})
export class FilesListComponent implements OnInit {
  readonly files = signal<FileItem[]>([]);
  readonly stats = signal<StorageStats | null>(null);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(private readonly filesApi: FilesApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.filesApi.list().subscribe({
      next: (files) => {
        this.files.set(files);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.filesApi.storageStats().subscribe((stats) => this.stats.set(stats));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    this.filesApi.upload(file).subscribe({
      next: () => {
        this.uploading.set(false);
        input.value = '';
        this.refresh();
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(
          err?.status === 403 ? 'Storage quota exceeded.' : 'Upload failed. Please try again.',
        );
      },
    });
  }

  download(file: FileItem): void {
    this.filesApi.getDownloadUrl(file.id).subscribe((url) => {
      window.open(url, '_blank');
    });
  }

  deleteFile(id: string): void {
    this.filesApi.remove(id).subscribe(() => this.refresh());
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  trackByFileId(_index: number, file: FileItem): string {
    return file.id;
  }
}
