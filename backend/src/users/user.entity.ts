import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../common/decimal.transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // select: false để không vô tình trả hash ra ngoài; chỉ lấy khi đăng nhập.
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  // --- Thiết lập tài chính ban đầu (bước 2 của đăng ký) ---
  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency: string;

  @Column({
    name: 'monthly_income',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  monthlyIncome: number | null;

  /** Ngày bắt đầu tháng tài chính (thường là ngày nhận lương), 1 đến 28. */
  @Column({ name: 'cycle_start_day', type: 'smallint', default: 1 })
  cycleStartDay: number;

  @Column({ name: 'onboarding_completed', type: 'boolean', default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
