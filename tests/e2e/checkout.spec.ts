import { expect, test } from '@playwright/test';

/**
 * E2E-T01: luồng chính từ menu đến xác nhận đơn (FR-01 → FR-10), trên khung hình điện thoại.
 * Xem menu → chi tiết, chọn size/topping → giỏ hàng → thanh toán khi chưa đăng nhập bị chuyển
 * sang đăng ký → thanh toán bằng ví → màn hình xác nhận "Đã thanh toán" → lịch sử đơn.
 */
test('E2E-T01 khách đặt và thanh toán một ly từ menu đến xác nhận đơn', async ({ page }) => {
  await page.goto('/');
  const grid = page.getByTestId('menu-grid');
  await expect(grid).toBeVisible();

  await grid.getByRole('link', { name: /Cappuccino/ }).click();
  await expect(page).toHaveURL(/\/products\/\d+/);
  await page.locator('button[aria-pressed]').filter({ hasText: /^L/ }).click();
  await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();

  await page.goto('/cart');
  await expect(page.getByTestId('cart-item')).toHaveCount(1);
  await page.getByRole('button', { name: /^Thanh toán/ }).click();

  // Chưa đăng nhập → trang đăng nhập, chuyển sang đăng ký tài khoản mới
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole('link', { name: 'Đăng ký' }).click();
  await page.getByLabel('Tên hiển thị').fill('Khách E2E');
  await page.getByLabel('Email').fill(`e2e-${Date.now()}@brewlite.test`);
  await page.getByLabel(/Mật khẩu/).fill('secret123');
  await page.getByRole('button', { name: 'Đăng ký' }).click();

  await expect(page).toHaveURL(/\/checkout/);
  await page.getByLabel('Ví điện tử').check();
  await page.getByRole('button', { name: /Xác nhận thanh toán/ }).click();

  await expect(page).toHaveURL(/\/orders\/\d+/);
  await expect(page.getByText('Đã thanh toán').first()).toBeVisible();
  await expect(page.getByText('Cappuccino').first()).toBeVisible();

  await page.goto('/orders');
  await expect(page.getByText('Đã thanh toán').first()).toBeVisible();
});
