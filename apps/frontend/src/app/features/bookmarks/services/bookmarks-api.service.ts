import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Bookmark } from '../models/bookmark.model';

@Injectable({ providedIn: 'root' })
export class BookmarksApiService {
  private readonly baseUrl = `${environment.apiUrl}/bookmarks`;

  constructor(private readonly http: HttpClient) {}

  list(search?: string): Observable<Bookmark[]> {
    const url = search ? `${this.baseUrl}?search=${encodeURIComponent(search)}` : this.baseUrl;
    return this.http.get<{ data: Bookmark[] }>(url).pipe(map((res) => res.data));
  }

  create(payload: { url: string; title: string; folder?: string }): Observable<Bookmark> {
    return this.http
      .post<{ data: Bookmark }>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  toggleFavorite(id: string, isFavorite: boolean): Observable<Bookmark> {
    return this.http
      .patch<{ data: Bookmark }>(`${this.baseUrl}/${id}`, { isFavorite })
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
