import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'aph_access_token';
const REFRESH_TOKEN_KEY = 'aph_refresh_token';

/**
 * Central auth state, backed by Angular Signals. Tokens are kept in
 * localStorage (short-lived access token + rotating refresh token) — for a
 * higher security bar, swap the access token storage for an in-memory value
 * refreshed via an httpOnly cookie-based refresh flow.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<{ data: AuthResponse }>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(
        tap((res) => this.persistSession(res.data)),
        // unwrap the {data} envelope produced by the backend TransformInterceptor
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as unknown as Observable<AuthResponse>;
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<{ data: AuthResponse }>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((res) => this.persistSession(res.data))) as unknown as Observable<AuthResponse>;
  }

  refresh(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<{ data: { accessToken: string; refreshToken: string } }>(
        `${environment.apiUrl}/auth/refresh`,
        { refreshToken },
      )
      .pipe(
        tap((res) => {
          localStorage.setItem(ACCESS_TOKEN_KEY, res.data.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refreshToken);
        }),
      ) as unknown as Observable<{ accessToken: string; refreshToken: string }>;
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    this._user.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }
}
