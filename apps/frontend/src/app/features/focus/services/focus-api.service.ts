import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FocusSession, FocusSessionType, TodayStats } from '../models/focus-session.model';

@Injectable({ providedIn: 'root' })
export class FocusApiService {
  private readonly baseUrl = `${environment.apiUrl}/focus/sessions`;

  constructor(private readonly http: HttpClient) {}

  history(): Observable<FocusSession[]> {
    return this.http.get<{ data: FocusSession[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  todayStats(): Observable<TodayStats> {
    return this.http
      .get<{ data: TodayStats }>(`${this.baseUrl}/stats/today`)
      .pipe(map((res) => res.data));
  }

  start(type: FocusSessionType, plannedMinutes: number): Observable<FocusSession> {
    return this.http
      .post<{ data: FocusSession }>(this.baseUrl, { type, plannedMinutes })
      .pipe(map((res) => res.data));
  }

  complete(id: string, actualSeconds: number, interrupted: boolean): Observable<FocusSession> {
    return this.http
      .patch<{ data: FocusSession }>(`${this.baseUrl}/${id}/complete`, {
        actualSeconds,
        interrupted,
      })
      .pipe(map((res) => res.data));
  }
}
