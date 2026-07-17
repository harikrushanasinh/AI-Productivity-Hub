import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<AppNotification[]> {
    return this.http.get<{ data: AppNotification[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  unreadCount(): Observable<number> {
    return this.http
      .get<{ data: { count: number } }>(`${this.baseUrl}/unread-count`)
      .pipe(map((res) => res.data.count));
  }

  markRead(id: string): Observable<AppNotification> {
    return this.http
      .patch<{ data: AppNotification }>(`${this.baseUrl}/${id}/read`, {})
      .pipe(map((res) => res.data));
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {});
  }
}
