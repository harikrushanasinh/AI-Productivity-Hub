import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Goal, Milestone } from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalsApiService {
  private readonly baseUrl = `${environment.apiUrl}/goals`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Goal[]> {
    return this.http.get<{ data: Goal[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  create(payload: { title: string }): Observable<Goal> {
    return this.http.post<{ data: Goal }>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addMilestone(goalId: string, title: string): Observable<Milestone> {
    return this.http
      .post<{ data: Milestone }>(`${this.baseUrl}/${goalId}/milestones`, { title })
      .pipe(map((res) => res.data));
  }

  toggleMilestone(goalId: string, milestoneId: string): Observable<Milestone> {
    return this.http
      .patch<{ data: Milestone }>(`${this.baseUrl}/${goalId}/milestones/${milestoneId}/toggle`, {})
      .pipe(map((res) => res.data));
  }
}
