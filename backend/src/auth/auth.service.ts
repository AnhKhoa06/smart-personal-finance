import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { toProfile, UsersService } from '../users/users.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { PasswordService } from './password.service';
import { TokensService } from './tokens.service';

const INVALID_LOGIN = 'Email hoặc mật khẩu không đúng';
const SESSION_EXPIRED = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';

/**
 * Hai request refresh gần như đồng thời (ví dụ frontend gọi song song) có thể làm token cũ
 * bị "dùng lại" trong tích tắc. Trong khoảng này ta chỉ từ chối, không coi là bị đánh cắp.
 */
const REUSE_GRACE_MS = 10_000;

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; driverError?: { code?: string } };
  return e?.code === '23505' || e?.driverError?.code === '23505';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokensService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password.toLowerCase() === dto.email) {
      throw new BadRequestException('Mật khẩu không được trùng với email');
    }
    if (await this.users.existsByEmail(dto.email)) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    const passwordHash = await this.passwords.hash(dto.password);

    try {
      // Tạo người dùng và ví đầu tiên trong cùng một transaction: lỗi ở bước nào thì hủy hết.
      const { user, wallet } = await this.dataSource.transaction((manager) =>
        this.users.createWithSetup(
          manager,
          { email: dto.email, passwordHash, fullName: dto.fullName },
          dto.setup,
        ),
      );
      const session = await this.tokens.createSession(user);
      return { user: toProfile(user), wallet, session };
    } catch (error) {
      // Hai người đăng ký cùng email cùng lúc: ràng buộc UNIQUE của DB là chốt chặn cuối.
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email này đã được đăng ký');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) {
      await this.passwords.compareDummy(dto.password);
      throw new UnauthorizedException(INVALID_LOGIN);
    }
    if (!(await this.passwords.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(INVALID_LOGIN);
    }

    await this.tokens.purgeExpired(user.id);
    const session = await this.tokens.createSession(user);
    return { user: toProfile(user), session };
  }

  /** Đổi refresh token cũ lấy cặp token mới (xoay vòng). Dùng lại token cũ sẽ thu hồi cả phiên. */
  async refresh(rawToken: string | undefined) {
    if (!rawToken) throw new UnauthorizedException(SESSION_EXPIRED);

    try {
      await this.tokens.verifyRefresh(rawToken);
    } catch {
      throw new UnauthorizedException(SESSION_EXPIRED);
    }

    const stored = await this.tokens.findByToken(rawToken);
    if (!stored) throw new UnauthorizedException(SESSION_EXPIRED);

    if (stored.revokedAt) {
      if (Date.now() - stored.revokedAt.getTime() > REUSE_GRACE_MS) {
        await this.tokens.revokeFamily(stored.familyId);
      }
      throw new UnauthorizedException(SESSION_EXPIRED);
    }

    if (!(await this.tokens.consume(stored.id))) {
      throw new UnauthorizedException(SESSION_EXPIRED);
    }

    const user = await this.users.findById(stored.userId);
    if (!user) throw new UnauthorizedException(SESSION_EXPIRED);

    return this.tokens.createSession(user, stored.familyId);
  }

  /** Đăng xuất thiết bị hiện tại: thu hồi cả phiên chứa refresh token này. Luôn thành công. */
  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const stored = await this.tokens.findByToken(rawToken);
    if (stored) await this.tokens.revokeFamily(stored.familyId);
  }

  /** Đổi mật khẩu: thu hồi mọi phiên cũ trên tất cả thiết bị, rồi cấp phiên mới cho thiết bị này. */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (!(await this.passwords.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    if (dto.newPassword.toLowerCase() === user.email) {
      throw new BadRequestException('Mật khẩu không được trùng với email');
    }

    const passwordHash = await this.passwords.hash(dto.newPassword);
    return this.dataSource.transaction(async (manager) => {
      await this.users.updatePasswordHash(user.id, passwordHash, manager);
      await this.tokens.revokeAllForUser(user.id, manager);
      return this.tokens.createSession(user, undefined, manager);
    });
  }
}
