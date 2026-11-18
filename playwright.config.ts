import { defineConfig, devices } from '@playwright/test';

/**
 * E2E chạy trên hệ thống đang chạy thật (web + API + PostgreSQL).
 * Local: docker compose up --build rồi npm run test:e2e.
 * CI: workflow khởi động API và web trước rồi đặt E2E_BASE_URL.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
});
