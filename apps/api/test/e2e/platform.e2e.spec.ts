import { auth, createApp, createProduct, item, registerUser, TestCtx } from './helpers';

/** Assignment 2: health check, migration, sổ điểm thưởng (LoyaltyTransaction). */
describe('BrewLite API – nền tảng (e2e)', () => {
  let ctx: TestCtx;
  beforeAll(async () => { ctx = await createApp(); });
  afterAll(async () => { await ctx.app.close(); });

  it('INT-T24 GET /health: 200, CSDL up, đã chạy đủ migration', async () => {
    const res = await ctx.http().get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'up' });
    expect(res.body.migrations).toBeGreaterThanOrEqual(2);
    expect(res.body).toHaveProperty('version');
  });

  it('INT-T25 schema tạo bằng migration có ràng buộc: tồn kho không âm, khoá ngoại', async () => {
    const p = await createProduct(ctx, 1);
    await expect(ctx.ds.query('UPDATE products SET stock = -1 WHERE id = $1', [p.id])).rejects.toThrow(/CHK_products_stock_non_negative/);
    await expect(ctx.ds.query(`INSERT INTO orders ("userId", subtotal, total) VALUES (999999, 1, 1)`)).rejects.toThrow(/foreign key/);
  });

  it('INT-T26 GET /loyalty/me: thanh toán ghi EARN, hủy đơn đã PAID ghi REVOKE, số dư khớp', async () => {
    const u = await registerUser(ctx);
    const p = await createProduct(ctx, 10, 50000);
    const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id, 3)] }).expect(201);
    await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', 'lt-1').send({ orderId: o.body.id, method: 'CARD' }).expect(201);
    await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', 'lt-1').send({ orderId: o.body.id, method: 'CARD' }).expect(200);

    let me = await ctx.http().get('/loyalty/me').set(auth(u.token)).expect(200);
    expect(me.body.balance).toBe(15);
    expect(me.body.transactions).toEqual([expect.objectContaining({ orderId: o.body.id, type: 'EARN', points: 15 })]);

    await ctx.http().post(`/orders/${o.body.id}/cancel`).set(auth(u.token)).expect(201);
    me = await ctx.http().get('/loyalty/me').set(auth(u.token)).expect(200);
    expect(me.body.balance).toBe(0);
    expect(me.body.transactions.map((t: { type: string }) => t.type)).toEqual(['REVOKE', 'EARN']);
  });

  it('INT-T27 GET /loyalty/me yêu cầu đăng nhập', async () => {
    await ctx.http().get('/loyalty/me').expect(401);
  });
});
