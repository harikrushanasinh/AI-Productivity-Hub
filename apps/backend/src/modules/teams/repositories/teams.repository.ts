import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TeamMember } from '../entities/team-member.entity';
import { TeamInvite } from '../entities/team-invite.entity';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class TeamsRepository {
  constructor(
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(TeamMember) private readonly memberRepo: Repository<TeamMember>,
    @InjectRepository(TeamInvite) private readonly inviteRepo: Repository<TeamInvite>,
    @InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
  ) {}

  // --- Teams ---
  async findTeamsForUser(userId: string): Promise<Team[]> {
    const memberships = await this.memberRepo.find({ where: { userId } });
    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length === 0) return [];
    return this.teamRepo
      .createQueryBuilder('team')
      .where('team.id IN (:...teamIds)', { teamIds })
      .getMany();
  }

  findTeamById(id: string): Promise<Team | null> {
    return this.teamRepo.findOne({ where: { id } });
  }

  createTeam(data: Partial<Team>): Team {
    return this.teamRepo.create(data);
  }

  saveTeam(team: Team): Promise<Team> {
    return this.teamRepo.save(team);
  }

  async softDeleteTeam(id: string): Promise<void> {
    await this.teamRepo.softDelete(id);
  }

  // --- Members ---
  findMembers(teamId: string): Promise<TeamMember[]> {
    return this.memberRepo.find({ where: { teamId } });
  }

  findMembership(teamId: string, userId: string): Promise<TeamMember | null> {
    return this.memberRepo.findOne({ where: { teamId, userId } });
  }

  createMember(data: Partial<TeamMember>): TeamMember {
    return this.memberRepo.create(data);
  }

  saveMember(member: TeamMember): Promise<TeamMember> {
    return this.memberRepo.save(member);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.memberRepo.delete({ teamId, userId });
  }

  // --- Invites ---
  createInvite(data: Partial<TeamInvite>): TeamInvite {
    return this.inviteRepo.create(data);
  }

  saveInvite(invite: TeamInvite): Promise<TeamInvite> {
    return this.inviteRepo.save(invite);
  }

  findInviteByToken(token: string): Promise<TeamInvite | null> {
    return this.inviteRepo.findOne({ where: { token } });
  }

  findPendingInvitesForTeam(teamId: string): Promise<TeamInvite[]> {
    return this.inviteRepo.find({ where: { teamId, status: 'pending' as any } });
  }

  // --- Comments ---
  findCommentsForEntity(entityType: string, entityId: string): Promise<Comment[]> {
    return this.commentRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'ASC' },
    });
  }

  createComment(data: Partial<Comment>): Comment {
    return this.commentRepo.create(data);
  }

  saveComment(comment: Comment): Promise<Comment> {
    return this.commentRepo.save(comment);
  }
}
