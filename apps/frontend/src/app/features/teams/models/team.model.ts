export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  token: string;
  status: string;
}
