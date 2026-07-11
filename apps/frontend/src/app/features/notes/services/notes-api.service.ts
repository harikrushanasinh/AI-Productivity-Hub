import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Note, PaginatedResult } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NotesApiService {
  private readonly baseUrl = `${environment.apiUrl}/notes`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<PaginatedResult<Note>> {
    return this.http
      .get<{ data: PaginatedResult<Note> }>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  create(payload: { title: string; content?: string }): Observable<Note> {
    return this.http
      .post<{ data: Note }>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
