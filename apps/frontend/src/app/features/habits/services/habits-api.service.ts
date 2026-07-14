import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Habit } from '../models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitsApiService {
  private readonly baseUrl = `${environment.apiUrl}/habits`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Habit[]> {
    return this.http.get<{ data: Habit[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  create(payload: { name: string }): Observable<Habit> {
    return this.http.post<{ data: Habit }>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  logToday(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/log`, {});
  }

  unlogToday(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/log`);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
