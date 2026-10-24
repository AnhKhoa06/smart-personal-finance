import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category, CategoryType } from './category.entity';

const DEFAULT_CATEGORIES: { name: string; type: CategoryType; icon: string }[] = [
  { name: 'Ăn uống', type: 'expense', icon: 'utensils' },
  { name: 'Di chuyển', type: 'expense', icon: 'bus' },
  { name: 'Mua sắm', type: 'expense', icon: 'shopping-bag' },
  { name: 'Hóa đơn', type: 'expense', icon: 'receipt' },
  { name: 'Giải trí', type: 'expense', icon: 'film' },
  { name: 'Sức khỏe', type: 'expense', icon: 'heart-pulse' },
  { name: 'Giáo dục', type: 'expense', icon: 'graduation-cap' },
  { name: 'Khác', type: 'expense', icon: 'ellipsis' },
  { name: 'Lương', type: 'income', icon: 'banknote' },
  { name: 'Thưởng', type: 'income', icon: 'gift' },
  { name: 'Thu nhập khác', type: 'income', icon: 'plus-circle' },
];

@Injectable()
export class CategoriesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
  ) {}

  /** Tạo bộ danh mục mặc định dùng chung (userId = null) nếu chưa có. */
  async onApplicationBootstrap() {
    const existing = await this.repo.count({ where: { userId: IsNull() } });
    if (existing > 0) return;
    await this.repo.save(
      DEFAULT_CATEGORIES.map((c) => this.repo.create({ ...c, userId: null })),
    );
    this.logger.log(`Đã tạo ${DEFAULT_CATEGORIES.length} danh mục mặc định`);
  }
}
