import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * AuthService implements JWT auth with Refresh Token Rotation (RTR):
 * - Access token: short-lived (15m), used on every request.
 * - Refresh token: long-lived (7d), single-use — its HASH is stored on the
 *   user record. Each refresh issues a brand new refresh token and invalidates
 *   the old one, so a stolen refresh token can only be replayed once before
 *   detection (re-use of an old token => all sessions revoked).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.usersService.create(dto);
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.usersService.validatePassword(user, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(userId: string, presentedRefreshToken: string): Promise<TokenPair> {
    const user = await this.usersService.findById(userId);

    if (!user.refreshTokenHash) {
      throw new ForbiddenException('Access denied');
    }

    const matches = await bcrypt.compare(presentedRefreshToken, user.refreshTokenHash);
    if (!matches) {
      // Possible token theft/replay — revoke all sessions for this user.
      await this.usersService.setRefreshTokenHash(user.id, null);
      throw new ForbiddenException('Access denied');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);

    return { accessToken, refreshToken };
  }
}
