import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamsService } from '../services/teams.service';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List teams the current user belongs to' })
  listMyTeams(@CurrentUser('userId') userId: string) {
    return this.teamsService.listMyTeams(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team (must be a member)' })
  getTeam(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.getTeam(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a team (creator becomes owner)' })
  createTeam(@CurrentUser('userId') userId: string, @Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a team (owner/admin only)' })
  updateTeam(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a team (owner only)' })
  deleteTeam(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.deleteTeam(id, userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List team members (must be a member)' })
  listMembers(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.listMembers(id, userId);
  }

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Invite someone by email (owner/admin only)' })
  inviteMember(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamsService.inviteMember(id, userId, dto);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept a team invitation using its token' })
  acceptInvite(@CurrentUser('userId') userId: string, @Param('token') token: string) {
    return this.teamsService.acceptInvite(token, userId);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: "Change a member's role (owner only)" })
  updateMemberRole(
    @CurrentUser('userId') requesterId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(id, targetUserId, requesterId, dto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member (owner/admin only)' })
  removeMember(
    @CurrentUser('userId') requesterId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.teamsService.removeMember(id, targetUserId, requesterId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a team (owners must transfer/delete instead)' })
  leaveTeam(@CurrentUser('userId') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.leaveTeam(id, userId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a resource (task, note, goal, ...)' })
  listComments(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.teamsService.listComments(id, userId, entityType, entityId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment on a resource' })
  addComment(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.teamsService.addComment(id, userId, dto);
  }
}
