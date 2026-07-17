import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TeamsRepository } from '../repositories/teams.repository';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { Team } from '../entities/team.entity';
import { TeamMember, TeamRole } from '../entities/team-member.entity';
import { TeamInvite, InviteStatus } from '../entities/team-invite.entity';
import { Comment } from '../entities/comment.entity';

const MANAGER_ROLES = [TeamRole.OWNER, TeamRole.ADMIN];

@Injectable()
export class TeamsService {
  constructor(private readonly teamsRepository: TeamsRepository) {}

  listMyTeams(userId: string): Promise<Team[]> {
    return this.teamsRepository.findTeamsForUser(userId);
  }

  async getTeam(id: string, userId: string): Promise<Team> {
    await this.requireMembership(id, userId);
    const team = await this.teamsRepository.findTeamById(id);
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async createTeam(ownerId: string, dto: CreateTeamDto): Promise<Team> {
    const team = this.teamsRepository.createTeam({ ...dto, ownerId, createdBy: ownerId });
    const saved = await this.teamsRepository.saveTeam(team);

    // Creator is automatically the first member, with the OWNER role.
    const ownerMembership = this.teamsRepository.createMember({
      teamId: saved.id,
      userId: ownerId,
      role: TeamRole.OWNER,
      createdBy: ownerId,
    });
    await this.teamsRepository.saveMember(ownerMembership);

    return saved;
  }

  async updateTeam(id: string, userId: string, dto: UpdateTeamDto): Promise<Team> {
    await this.requireRole(id, userId, MANAGER_ROLES);
    const team = await this.teamsRepository.findTeamById(id);
    if (!team) throw new NotFoundException('Team not found');

    Object.assign(team, dto, { updatedBy: userId });
    return this.teamsRepository.saveTeam(team);
  }

  async deleteTeam(id: string, userId: string): Promise<void> {
    await this.requireRole(id, userId, [TeamRole.OWNER]);
    await this.teamsRepository.softDeleteTeam(id);
  }

  listMembers(teamId: string, userId: string): Promise<TeamMember[]> {
    return this.requireMembership(teamId, userId).then(() =>
      this.teamsRepository.findMembers(teamId),
    );
  }

  async inviteMember(teamId: string, inviterId: string, dto: InviteMemberDto): Promise<TeamInvite> {
    await this.requireRole(teamId, inviterId, MANAGER_ROLES);

    const token = randomBytes(24).toString('hex');
    const invite = this.teamsRepository.createInvite({
      teamId,
      email: dto.email,
      invitedBy: inviterId,
      token,
      status: InviteStatus.PENDING,
      createdBy: inviterId,
    });
    return this.teamsRepository.saveInvite(invite);
  }

  /**
   * A logged-in user accepts an invite using the token they received (e.g. via
   * a link). No email-sending is implemented here — see Future Improvements —
   * the token itself is returned to the inviter today for manual sharing.
   */
  async acceptInvite(token: string, userId: string): Promise<TeamMember> {
    const invite = await this.teamsRepository.findInviteByToken(token);
    if (!invite || invite.status !== InviteStatus.PENDING) {
      throw new NotFoundException('Invite not found or already used');
    }

    const existing = await this.teamsRepository.findMembership(invite.teamId, userId);
    if (existing) {
      throw new ConflictException('You are already a member of this team');
    }

    invite.status = InviteStatus.ACCEPTED;
    await this.teamsRepository.saveInvite(invite);

    const membership = this.teamsRepository.createMember({
      teamId: invite.teamId,
      userId,
      role: TeamRole.MEMBER,
      createdBy: userId,
    });
    return this.teamsRepository.saveMember(membership);
  }

  async updateMemberRole(
    teamId: string,
    targetUserId: string,
    requesterId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<TeamMember> {
    await this.requireRole(teamId, requesterId, [TeamRole.OWNER]);

    const membership = await this.teamsRepository.findMembership(teamId, targetUserId);
    if (!membership) throw new NotFoundException('Member not found');

    membership.role = dto.role;
    membership.updatedBy = requesterId;
    return this.teamsRepository.saveMember(membership);
  }

  async removeMember(teamId: string, targetUserId: string, requesterId: string): Promise<void> {
    if (targetUserId === requesterId) {
      throw new ForbiddenException('Use the leave-team action to remove yourself');
    }
    await this.requireRole(teamId, requesterId, MANAGER_ROLES);
    await this.teamsRepository.removeMember(teamId, targetUserId);
  }

  async leaveTeam(teamId: string, userId: string): Promise<void> {
    const membership = await this.requireMembership(teamId, userId);
    if (membership.role === TeamRole.OWNER) {
      throw new ForbiddenException(
        'The owner cannot leave a team — transfer ownership or delete the team instead',
      );
    }
    await this.teamsRepository.removeMember(teamId, userId);
  }

  async listComments(teamId: string, userId: string, entityType: string, entityId: string) {
    await this.requireMembership(teamId, userId);
    return this.teamsRepository.findCommentsForEntity(entityType, entityId);
  }

  async addComment(teamId: string, userId: string, dto: CreateCommentDto): Promise<Comment> {
    await this.requireMembership(teamId, userId);
    const comment = this.teamsRepository.createComment({
      teamId,
      authorId: userId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      content: dto.content,
      createdBy: userId,
    });
    return this.teamsRepository.saveComment(comment);
  }

  private async requireMembership(teamId: string, userId: string): Promise<TeamMember> {
    const membership = await this.teamsRepository.findMembership(teamId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this team');
    }
    return membership;
  }

  private async requireRole(teamId: string, userId: string, allowed: TeamRole[]): Promise<void> {
    const membership = await this.requireMembership(teamId, userId);
    if (!allowed.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
}
