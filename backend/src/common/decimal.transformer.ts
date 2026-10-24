import { ValueTransformer } from 'typeorm';

/** PostgreSQL trả decimal về dạng chuỗi; chuyển sang number cho tiện dùng. */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? null : Number(value),
};

/** Giới hạn của decimal(15,2). */
export const MAX_MONEY = 9_999_999_999_999;
