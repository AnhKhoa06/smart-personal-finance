import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { EntityManager, IsNull, LessThan, Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

export interface RefreshPayload {
  sub: string;
  fid: string;
}

export interface Session {
  accessToken: string;
  /** Thời gian sống của access token, tính bằng giây. */
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken) private readonly repo: Repository<RefreshToken>,
  ) {}

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Cấp cặp access + refresh token mới. familyId giữ nguyên khi xoay vòng, tạo mới khi đăng nhập. */
  async createSession(
    user: { id: number; role: string },
    familyId: string = randomUUID(),
    manager?: EntityManager,
  ): Promise<Session> {
    const accessToken = await this.jwt.signAsync(
      { sub: String(user.id), role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES') as JwtSignOptions['expiresIn'],
      },
    );
    const decoded = this.jwt.decode<{ exp: number; iat: number }>(accessToken);

    const refreshToken = await this.jwt.signAsync(
      { sub: String(user.id), fid: familyId } satisfies RefreshPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES') as JwtSignOptions['expiresIn'],
        jwtid: randomUUID(),
      },
    );
    const refreshExp = this.jwt.decode<{ exp: number }>(refreshToken).exp;
    const refreshExpiresAt = new Date(refreshExp * 1000);

    const repo = manager ? manager.getRepository(RefreshToken) : this.repo;
    await repo.save(
      repo.create({
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        familyId,
        expiresAt: refreshExpiresAt,
        revokedAt: null,
      }),
    );

    return {
      accessToken,
      expiresIn: decoded.exp - decoded.iat,
      refreshToken,
      refreshExpiresAt,
    };
  }

  verifyRefresh(token: string) {
    return this.jwt.verifyAsync<RefreshPayload>(token, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  findByToken(token: string) {
    return this.repo.findOne({ where: { tokenHash: this.hash(token) } });
  }

  /**
   * Đánh dấu token đã dùng. Chỉ thành công nếu nó chưa bị thu hồi, nên hai request
   * đồng thời không thể cùng đổi một token.
   */
  async consume(id: number): Promise<boolean> {
    const result = await this.repo.update(
      { id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return (result.affected ?? 0) === 1;
  }

  /** Thu hồi toàn bộ token của một phiên đăng nhập. */
  async revokeFamily(familyId: string) {
    await this.repo.update({ familyId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  /** Thu hồi mọi phiên của một người dùng (dùng khi đổi mật khẩu). */
  async revokeAllForUser(userId: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(RefreshToken) : this.repo;
    await repo.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  /** Dọn các token đã hết hạn của người dùng này để bảng không phình ra. */
  async purgeExpired(userId: number) {
    await this.repo.delete({ userId, expiresAt: LessThan(new Date()) });
  }
}
