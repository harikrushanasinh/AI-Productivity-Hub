import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Team, TeamInvite, TeamMember } from '../models/team.model';

@Injectable({ providedIn: 'root' })
export class TeamsApiService {
  private readonly baseUrl = `${environment.apiUrl}/teams`;

  constructor(private readonly http: HttpClient) {}

  listMyTeams(): Observable<Team[]> {
    return this.http.get<{ data: Team[] }>(this.baseUrl).pipe(map((res) => res.data));
  }

  create(payload: { name: string; description?: string }): Observable<Team> {
    return this.http.post<{ data: Team }>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  listMembers(teamId: string): Observable<TeamMember[]> {
    return this.http
      .get<{ data: TeamMember[] }>(`${this.baseUrl}/${teamId}/members`)
      .pipe(map((res) => res.data));
  }

  invite(teamId: string, email: string): Observable<TeamInvite> {
    return this.http
      .post<{ data: TeamInvite }>(`${this.baseUrl}/${teamId}/invitations`, { email })
      .pipe(map((res) => res.data));
  }

  acceptInvite(token: string): Observable<TeamMember> {
    return this.http
      .post<{ data: TeamMember }>(`${this.baseUrl}/invitations/${token}/accept`, {})
      .pipe(map((res) => res.data));
  }

  removeMember(teamId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${teamId}/members/${userId}`);
  }

  leaveTeam(teamId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${teamId}/leave`, {});
  }
}
