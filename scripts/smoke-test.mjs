#!/usr/bin/env node
/**
 * Smoke test sau triển khai (dùng trong pipeline CD và khi rollback).
 * node scripts/smoke-test.mjs <API_URL> <WEB_URL> [EXPECTED_VERSION] [--api-only]
 * EXPECTED_VERSION: commit SHA phải đang chạy (chờ tới khi bản mới lên). --api-only: bỏ qua web.
 * Thoát mã 1 nếu một kiểm tra thất bại. Thử lại vài lần vì dịch vụ có thể đang khởi động.
 */
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const apiOnly = process.argv.includes('--api-only');
const [api, web, expected] = [args[0] ?? process.env.API_URL, args[1] ?? process.env.WEB_URL, args[2] || process.env.EXPECTED_VERSION];
if (!api || !web) { console.error('Cách dùng: smoke-test.mjs <API_URL> <WEB_URL> [EXPECTED_VERSION]'); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function attempt(name, fn, tries = 10, wait = 15000) {
  for (let i = 1; i <= tries; i++) {
    try { const info = await fn(); console.log(`✔ ${name}${info ? ' – ' + info : ''}`); return; }
    catch (e) { console.log(`… ${name} (lần ${i}/${tries}): ${e.message}`); if (i < tries) await sleep(wait); }
  }
  throw new Error(`Smoke test thất bại: ${name}`);
}
async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

try {
  await attempt('API /health', async () => {
    const h = await getJson(`${api}/health`);
    if (h.status !== 'ok' || h.db !== 'up') throw new Error(JSON.stringify(h));
    if (expected && h.version !== expected) throw new Error(`đang chạy ${h.version}, chờ ${expected}`);
    return `version ${h.version}, ${h.migrations} migration`;
  }, Number(process.env.SMOKE_TRIES ?? 24)); // tới ~6 phút: Render cần thời gian kéo image và khởi động
  await attempt('API GET /products', async () => {
    const list = await getJson(`${api}/products`);
    if (!Array.isArray(list) || list.length === 0) throw new Error('menu rỗng');
    return `${list.length} sản phẩm`;
  }, 3, 5000);
  if (apiOnly) { console.log('API đạt.'); process.exit(0); }
  await attempt('Web /health', async () => {
    const h = await getJson(`${web}/health`);
    if (h.status !== 'ok') throw new Error(JSON.stringify(h));
    if (expected && h.version !== expected) throw new Error(`đang chạy ${h.version}, chờ ${expected}`);
    return `version ${h.version}`;
  }, Number(process.env.SMOKE_TRIES ?? 24));
  await attempt('Web trang Menu', async () => {
    const res = await fetch(web, { signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    if (!res.ok || !html.includes('BrewLite')) throw new Error(`HTTP ${res.status}`);
    return `HTTP ${res.status}`;
  }, 6, 10000);
  await attempt('Web manifest PWA', async () => {
    const m = await getJson(`${web}/manifest.webmanifest`);
    if (m.short_name !== 'BrewLite') throw new Error('manifest sai');
  }, 3, 5000);
  console.log('Smoke test đạt.');
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
