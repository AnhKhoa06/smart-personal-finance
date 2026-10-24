import { applyDecorators } from '@nestjs/common';
import {
  IsString,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { COMMON_PASSWORDS } from '../common-passwords';

/** bcrypt chỉ dùng 72 byte đầu của mật khẩu, nên chặn luôn thay vì cắt âm thầm. */
@ValidatorConstraint({ name: 'passwordMaxBytes' })
class PasswordMaxBytes implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72;
  }
  defaultMessage() {
    return 'Mật khẩu quá dài (tối đa 72 byte, khoảng 72 ký tự không dấu)';
  }
}

@ValidatorConstraint({ name: 'passwordNotCommon' })
class PasswordNotCommon implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'string' && !COMMON_PASSWORDS.has(value.toLowerCase());
  }
  defaultMessage() {
    return 'Mật khẩu này quá phổ biến, vui lòng chọn mật khẩu khác';
  }
}

/** Chính sách mật khẩu: dài tối thiểu 10 ký tự, tối đa 72 byte, không nằm trong danh sách phổ biến. */
export const Password = () =>
  applyDecorators(
    IsString({ message: 'Mật khẩu phải là chuỗi ký tự' }),
    MinLength(10, { message: 'Mật khẩu phải có ít nhất 10 ký tự' }),
    Validate(PasswordMaxBytes),
    Validate(PasswordNotCommon),
  );
