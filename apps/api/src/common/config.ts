import { Logger } from '@nestjs/common';

/**
 * Kiểm tra cấu hình lúc khởi động (fail fast). Ở production thiếu biến bắt buộc thì dừng
 * ngay, để nền tảng triển khai đánh dấu bản deploy thất bại thay vì chạy với cấu hình sai.
 */
export function validateConfig(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  const missing = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  if ((env.JWT_SECRET ?? '').length < 32) throw new Error('JWT_SECRET phải dài ít nhất 32 ký tự ở production');
  new Logger('Config').log('Cấu hình production hợp lệ');
}

export const appVersion = () => process.env.APP_VERSION ?? process.env.GIT_SHA ?? 'dev';
