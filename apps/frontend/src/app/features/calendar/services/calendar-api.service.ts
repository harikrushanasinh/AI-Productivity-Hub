import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarEvent } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly baseUrl = `${environment.apiUrl}/calendar/events`;

  constructor(private readonly http: HttpClient) {}

  list(from?: string, to?: string): Observable<CalendarEvent[]> {
    let url = this.baseUrl;
    if (from && to) {
      url += `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    }
    return this.http.get<{ data: CalendarEvent[] }>(url).pipe(map((res) => res.data));
  }

  create(payload: {
    title: string;
    startAt: string;
    endAt: string;
    color?: string;
  }): Observable<CalendarEvent> {
    return this.http
      .post<{ data: CalendarEvent }>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
