import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MAX_MONEY } from '../../common/decimal.transformer';
import { WALLET_TYPES } from '../../wallets/wallet.entity';

export const CURRENCIES = ['VND', 'USD', 'EUR'] as const;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class WalletSetupDto {
  @Transform(trim)
  @IsString({ message: 'Tên ví phải là chuỗi ký tự' })
  @Length(1, 100, { message: 'Tên ví dài từ 1 đến 100 ký tự' })
  name: string;

  @IsIn(WALLET_TYPES, {
    message: 'Loại ví phải là cash (tiền mặt), bank (ngân hàng) hoặc e_wallet (ví điện tử)',
  })
  type: (typeof WALLET_TYPES)[number];

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Số dư phải là số, tối đa 2 chữ số thập phân' })
  @Min(0, { message: 'Số dư không được âm' })
  @Max(MAX_MONEY, { message: 'Số dư vượt quá giới hạn cho phép' })
  balance: number;
}

/** Bước 2 của đăng ký: thiết lập tài chính ban đầu. */
export class SetupDto {
  @IsDefined({ message: 'Cần có thông tin ví đầu tiên' })
  @ValidateNested()
  @Type(() => WalletSetupDto)
  wallet: WalletSetupDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Thu nhập phải là số' })
  @Min(0, { message: 'Thu nhập không được âm' })
  @Max(MAX_MONEY, { message: 'Thu nhập vượt quá giới hạn cho phép' })
  monthlyIncome?: number;

  @IsOptional()
  @IsInt({ message: 'Ngày bắt đầu tháng tài chính phải là số nguyên' })
  @Min(1, { message: 'Ngày bắt đầu tháng tài chính từ 1 đến 28' })
  @Max(28, { message: 'Ngày bắt đầu tháng tài chính từ 1 đến 28' })
  cycleStartDay?: number;

  @IsOptional()
  @IsIn(CURRENCIES, { message: 'Tiền tệ hiện hỗ trợ: VND, USD, EUR' })
  currency?: (typeof CURRENCIES)[number];
}
