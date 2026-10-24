import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import type { WalletSetupDto } from '../users/dto/setup.dto';
import { Wallet } from './wallet.entity';

@Injectable()
export class WalletsService {
  /** Tạo ví đầu tiên trong cùng transaction với việc đăng ký / thiết lập. */
  createInitial(manager: EntityManager, userId: number, dto: WalletSetupDto) {
    return manager.save(
      manager.create(Wallet, {
        userId,
        name: dto.name,
        type: dto.type,
        balance: dto.balance,
      }),
    );
  }
}
