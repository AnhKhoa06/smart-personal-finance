import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../common/decimal.transformer';
import { User } from '../users/user.entity';

export const WALLET_TYPES = ['cash', 'bank', 'e_wallet'] as const;
export type WalletType = (typeof WALLET_TYPES)[number];

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  type: WalletType;

  /** Số dư hiện tại. Khi tạo ví, đây chính là số dư ban đầu người dùng nhập. */
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  balance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
