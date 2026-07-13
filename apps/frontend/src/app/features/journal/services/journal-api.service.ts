import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { JournalEntry, PaginatedResult } from '../models/journal-entry.model';

@Injectable({ providedIn: 'root' })
export class JournalApiService {
  private readonly baseUrl = `${environment.apiUrl}/journal/entries`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<PaginatedResult<JournalEntry>> {
    return this.http
      .get<{ data: PaginatedResult<JournalEntry> }>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  create(payload: { entryDate: string; content: string; mood?: number }): Observable<JournalEntry> {
    return this.http
      .post<{ data: JournalEntry }>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
