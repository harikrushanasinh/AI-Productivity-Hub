import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamsApiService } from '../services/teams-api.service';
import { Team, TeamMember } from '../models/team.model';

@Component({
  selector: 'aph-teams-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teams-list.component.html',
  styleUrl: './teams-list.component.scss',
})
export class TeamsListComponent implements OnInit {
  readonly teams = signal<Team[]>([]);
  readonly loading = signal(true);
  readonly newTeamName = signal('');

  readonly expandedTeamId = signal<string | null>(null);
  readonly membersByTeam = signal<Record<string, TeamMember[]>>({});
  readonly inviteEmail = signal<Record<string, string>>({});
  readonly lastInviteToken = signal<string | null>(null);

  constructor(private readonly teamsApi: TeamsApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.teamsApi.listMyTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createTeam(): void {
    const name = this.newTeamName().trim();
    if (!name) return;
    this.teamsApi.create({ name }).subscribe(() => {
      this.newTeamName.set('');
      this.refresh();
    });
  }

  toggleExpand(teamId: string): void {
    if (this.expandedTeamId() === teamId) {
      this.expandedTeamId.set(null);
      return;
    }
    this.expandedTeamId.set(teamId);
    this.teamsApi.listMembers(teamId).subscribe((members) => {
      this.membersByTeam.update((map) => ({ ...map, [teamId]: members }));
    });
  }

  inviteDraft(teamId: string): string {
    return this.inviteEmail()[teamId] ?? '';
  }

  setInviteDraft(teamId: string, value: string): void {
    this.inviteEmail.update((map) => ({ ...map, [teamId]: value }));
  }

  sendInvite(teamId: string): void {
    const email = this.inviteDraft(teamId).trim();
    if (!email) return;

    this.teamsApi.invite(teamId, email).subscribe((invite) => {
      this.setInviteDraft(teamId, '');
      // No email delivery is wired up yet — surface the token so it can be
      // shared manually (e.g. pasted into a chat message) until that ships.
      this.lastInviteToken.set(invite.token);
    });
  }

  removeMember(teamId: string, userId: string): void {
    this.teamsApi.removeMember(teamId, userId).subscribe(() => this.toggleExpandRefresh(teamId));
  }

  leaveTeam(teamId: string): void {
    this.teamsApi.leaveTeam(teamId).subscribe(() => this.refresh());
  }

  private toggleExpandRefresh(teamId: string): void {
    this.teamsApi.listMembers(teamId).subscribe((members) => {
      this.membersByTeam.update((map) => ({ ...map, [teamId]: members }));
    });
  }

  membersFor(teamId: string): TeamMember[] {
    return this.membersByTeam()[teamId] ?? [];
  }

  trackByTeamId(_index: number, team: Team): string {
    return team.id;
  }

  trackByMemberId(_index: number, member: TeamMember): string {
    return member.id;
  }
}
