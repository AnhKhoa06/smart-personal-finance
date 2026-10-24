import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService implements OnModuleInit {
  private readonly cost: number;
  private dummyHash = '';

  constructor(config: ConfigService) {
    this.cost = Number(config.getOrThrow<string>('BCRYPT_COST'));
  }

  async onModuleInit() {
    this.dummyHash = await bcrypt.hash('mat-khau-gia-de-can-bang-thoi-gian', this.cost);
  }

  hash(plain: string) {
    return bcrypt.hash(plain, this.cost);
  }

  compare(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Khi email không tồn tại vẫn tốn thời gian bcrypt như khi có tồn tại,
   * để kẻ tấn công không dò được email nào có tài khoản qua thời gian phản hồi.
   */
  async compareDummy(plain: string) {
    await bcrypt.compare(plain, this.dummyHash);
  }
}
