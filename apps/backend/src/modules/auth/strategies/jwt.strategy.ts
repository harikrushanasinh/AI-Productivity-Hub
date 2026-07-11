import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/services/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Validates the short-lived access token on every protected request.
 * Runs on each request via JwtAuthGuard — keep this fast (no heavy queries).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') as string,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or does not exist');
    }
    // Attached to request.user — consumed by @CurrentUser() and RolesGuard.
    return { userId: user.id, email: user.email, role: user.role };
  }
}
