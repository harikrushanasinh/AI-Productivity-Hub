import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AnalyticsDashboard } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private readonly baseUrl = `${environment.apiUrl}/analytics`;

  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<AnalyticsDashboard> {
    return this.http
      .get<{ data: AnalyticsDashboard }>(`${this.baseUrl}/dashboard`)
      .pipe(map((res) => res.data));
  }
}
