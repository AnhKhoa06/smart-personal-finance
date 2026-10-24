/**
 * Kiểm tra biến môi trường khi khởi động. Thiếu hoặc yếu thì dừng ngay,
 * không để server chạy với secret rỗng.
 */
export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];
  const str = (key: string, fallback?: string): string => {
    const raw = config[key];
    if (typeof raw === 'string' && raw.trim() !== '') return raw.trim();
    if (fallback !== undefined) return fallback;
    errors.push(`${key} chưa được cấu hình`);
    return '';
  };

  const accessSecret = str('JWT_ACCESS_SECRET');
  const refreshSecret = str('JWT_REFRESH_SECRET');
  for (const [key, value] of [
    ['JWT_ACCESS_SECRET', accessSecret],
    ['JWT_REFRESH_SECRET', refreshSecret],
  ]) {
    if (value && value.length < 32) {
      errors.push(`${key} phải dài ít nhất 32 ký tự`);
    }
  }
  if (accessSecret && accessSecret === refreshSecret) {
    errors.push('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET phải khác nhau');
  }

  const bcryptCost = Number(str('BCRYPT_COST', '12'));
  if (!Number.isInteger(bcryptCost) || bcryptCost < 10 || bcryptCost > 15) {
    errors.push('BCRYPT_COST phải là số nguyên từ 10 đến 15');
  }

  if (errors.length > 0) {
    throw new Error(`Cấu hình .env không hợp lệ:\n- ${errors.join('\n- ')}`);
  }

  return {
    ...config,
    PORT: str('PORT', '3000'),
    NODE_ENV: str('NODE_ENV', 'development'),
    FRONTEND_URL: str('FRONTEND_URL', 'http://localhost:5173'),
    JWT_ACCESS_SECRET: accessSecret,
    JWT_REFRESH_SECRET: refreshSecret,
    JWT_ACCESS_EXPIRES: str('JWT_ACCESS_EXPIRES', '15m'),
    JWT_REFRESH_EXPIRES: str('JWT_REFRESH_EXPIRES', '7d'),
    BCRYPT_COST: String(bcryptCost),
  };
}
