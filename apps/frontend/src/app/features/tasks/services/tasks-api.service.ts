import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Task, TaskStatus } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Task[]> {
    return this.http.get<{ data: Task[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  create(payload: { title: string }): Observable<Task> {
    return this.http.post<{ data: Task }>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  updateStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.http
      .patch<{ data: Task }>(`${this.baseUrl}/${id}`, { status })
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
