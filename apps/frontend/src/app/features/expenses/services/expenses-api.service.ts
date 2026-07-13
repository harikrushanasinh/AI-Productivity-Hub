import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Expense, ExpenseSummary, PaginatedResult } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpensesApiService {
  private readonly baseUrl = `${environment.apiUrl}/expenses`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<PaginatedResult<Expense>> {
    return this.http
      .get<{ data: PaginatedResult<Expense> }>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  summary(): Observable<ExpenseSummary> {
    return this.http
      .get<{ data: ExpenseSummary }>(`${this.baseUrl}/summary`)
      .pipe(map((res) => res.data));
  }

  create(payload: {
    title: string;
    amountMinor: number;
    spentOn: string;
    type?: string;
    category?: string;
  }): Observable<Expense> {
    return this.http
      .post<{ data: Expense }>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
