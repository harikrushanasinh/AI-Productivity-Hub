import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamInvite } from './entities/team-invite.entity';
import { Comment } from './entities/comment.entity';
import { TeamsController } from './controllers/teams.controller';
import { TeamsService } from './services/teams.service';
import { TeamsRepository } from './repositories/teams.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Team, TeamMember, TeamInvite, Comment])],
  controllers: [TeamsController],
  providers: [TeamsService, TeamsRepository],
  exports: [TeamsService],
})
export class TeamsModule {}
