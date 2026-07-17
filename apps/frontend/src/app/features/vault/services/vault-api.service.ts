import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RevealedSecret, VaultItemSummary } from '../models/vault-item.model';

@Injectable({ providedIn: 'root' })
export class VaultApiService {
  private readonly baseUrl = `${environment.apiUrl}/vault/items`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<VaultItemSummary[]> {
    return this.http.get<{ data: VaultItemSummary[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  create(payload: { title: string; username?: string; password: string; url?: string }): Observable<VaultItemSummary> {
    return this.http
      .post<{ data: VaultItemSummary }>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  reveal(id: string): Observable<RevealedSecret> {
    return this.http
      .post<{ data: RevealedSecret }>(`${this.baseUrl}/${id}/reveal`, {})
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
