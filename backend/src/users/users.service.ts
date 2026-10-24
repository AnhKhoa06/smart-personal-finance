import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Wallet } from '../wallets/wallet.entity';
import { WalletsService } from '../wallets/wallets.service';
import { SetupDto } from './dto/setup.dto';
import { User } from './user.entity';

export type UserProfile = Omit<User, 'passwordHash'>;

export function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    currency: user.currency,
    monthlyIncome: user.monthlyIncome,
    cycleStartDay: user.cycleStartDay,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly wallets: WalletsService,
  ) {}

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async existsByEmail(email: string) {
    return this.repo.exists({ where: { email } });
  }

  /** Lấy cả passwordHash (mặc định bị ẩn) để so khớp khi đăng nhập / đổi mật khẩu. */
  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
  }

  findByIdWithPassword(id: number) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  async updatePasswordHash(userId: number, passwordHash: string, manager?: EntityManager) {
    await (manager ?? this.dataSource.manager).update(User, userId, { passwordHash });
  }

  /** Tạo người dùng, và nếu có thiết lập ban đầu thì tạo luôn ví đầu tiên. Gọi trong transaction. */
  async createWithSetup(
    manager: EntityManager,
    data: { email: string; passwordHash: string; fullName: string },
    setup?: SetupDto,
  ): Promise<{ user: User; wallet: Wallet | null }> {
    const user = manager.create(User, {
      ...data,
      ...(setup ? this.setupColumns(setup) : {}),
    });
    await manager.save(user);
    const wallet = setup
      ? await this.wallets.createInitial(manager, user.id, setup.wallet)
      : null;
    return { user, wallet };
  }

  /** Dành cho người dùng đã bấm "Bỏ qua, thiết lập sau" ở lúc đăng ký. */
  async completeOnboarding(userId: number, setup: SetupDto) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('Không tìm thấy người dùng');
      if (user.onboardingCompleted) {
        throw new ConflictException('Bạn đã hoàn tất thiết lập ban đầu rồi');
      }
      Object.assign(user, this.setupColumns(setup));
      await manager.save(user);
      const wallet = await this.wallets.createInitial(manager, user.id, setup.wallet);
      return { user, wallet };
    });
  }

  private setupColumns(setup: SetupDto): Partial<User> {
    return {
      currency: setup.currency ?? 'VND',
      monthlyIncome: setup.monthlyIncome ?? null,
      cycleStartDay: setup.cycleStartDay ?? 1,
      onboardingCompleted: true,
    };
  }
}
