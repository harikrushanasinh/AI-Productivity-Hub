import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FileItem, StorageStats } from '../models/file.model';

@Injectable({ providedIn: 'root' })
export class FilesApiService {
  private readonly baseUrl = `${environment.apiUrl}/files`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<FileItem[]> {
    return this.http.get<{ data: FileItem[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  storageStats(): Observable<StorageStats> {
    return this.http
      .get<{ data: StorageStats }>(`${this.baseUrl}/storage-stats`)
      .pipe(map((res) => res.data));
  }

  /**
   * Full upload flow: request a presigned URL, PUT the raw file directly to S3
   * (bypassing our API for the actual bytes), then confirm the metadata.
   */
  upload(file: File): Observable<FileItem> {
    return this.http
      .post<{ data: { uploadUrl: string; storageKey: string } }>(`${this.baseUrl}/upload-url`, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        folderPath: '/',
      })
      .pipe(
        switchMap(({ data }) =>
          this.http
            .put(data.uploadUrl, file, { headers: { 'Content-Type': file.type } })
            .pipe(map(() => data.storageKey)),
        ),
        switchMap((storageKey) =>
          this.http.post<{ data: FileItem }>(`${this.baseUrl}/confirm`, {
            storageKey,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            folderPath: '/',
          }),
        ),
        map((res) => res.data),
      );
  }

  getDownloadUrl(id: string): Observable<string> {
    return this.http
      .get<{ data: { downloadUrl: string } }>(`${this.baseUrl}/${id}/download-url`)
      .pipe(map((res) => res.data.downloadUrl));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
