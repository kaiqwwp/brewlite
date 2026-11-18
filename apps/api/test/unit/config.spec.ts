import { validateConfig } from '../../src/common/config';

describe('Kiểm tra cấu hình khi khởi động', () => {
  const good = { NODE_ENV: 'production', DATABASE_URL: 'postgres://x', JWT_SECRET: 'x'.repeat(32), CORS_ORIGIN: 'https://web' };
  it('UT-12 môi trường dev không bắt buộc biến nào', () => {
    expect(() => validateConfig({ NODE_ENV: 'development' })).not.toThrow();
  });
  it('UT-13 production: thiếu biến bắt buộc thì dừng ngay', () => {
    expect(() => validateConfig({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL, JWT_SECRET, CORS_ORIGIN/);
  });
  it('UT-14 production: JWT_SECRET ngắn hơn 32 ký tự bị từ chối', () => {
    expect(() => validateConfig({ ...good, JWT_SECRET: 'short' })).toThrow(/32/);
  });
  it('UT-15 production: đủ cấu hình thì chạy', () => {
    expect(() => validateConfig(good)).not.toThrow();
  });
});
