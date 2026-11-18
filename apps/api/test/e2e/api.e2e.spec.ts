import { auth, createApp, createCoupon, createProduct, createStaff, item, registerUser, TestCtx } from './helpers';
import { Product } from '../../src/entities/product.entity';
import { User } from '../../src/entities/user.entity';

describe('BrewLite API (e2e)', () => {
  let ctx: TestCtx;
  beforeAll(async () => { ctx = await createApp(); });
  afterAll(async () => { await ctx.app.close(); });

  describe('Task 2 – sản phẩm', () => {
    it('GET /products trả menu (id, tên, giá, ảnh) và GET /products/:id kèm tuỳ chọn', async () => {
      const p = await createProduct(ctx, 5, 39000, 'Trà đào');
      const list = await ctx.http().get('/products').expect(200);
      expect(list.body.find((x: any) => x.id === p.id)).toMatchObject({ id: p.id, name: 'Trà đào', price: 39000 });
      expect(list.body[0]).toHaveProperty('imageUrl');
      const detail = await ctx.http().get(`/products/${p.id}`).expect(200);
      expect(detail.body.options.sizes.map((s: any) => s.code)).toEqual(['S', 'M', 'L']);
      expect(detail.body.options.toppings.length).toBeGreaterThan(0);
      await ctx.http().get('/products/999999').expect(404);
    });
  });

  describe('Task 7 – đăng ký / đăng nhập (JWT)', () => {
    it('đăng ký, băm mật khẩu, đăng nhập, /auth/me', async () => {
      const email = 'a@test.local';
      const reg = await ctx.http().post('/auth/register').send({ email, password: 'secret123' }).expect(201);
      expect(reg.body.accessToken).toBeTruthy();
      const row = await ctx.ds.manager.findOneByOrFail(User, { email });
      expect(row.passwordHash).not.toContain('secret123');
      expect(row.passwordHash.startsWith('$2')).toBe(true); // bcrypt
      const login = await ctx.http().post('/auth/login').send({ email, password: 'secret123' }).expect(200);
      const me = await ctx.http().get('/auth/me').set(auth(login.body.accessToken)).expect(200);
      expect(me.body).toMatchObject({ email, loyaltyPoints: 0, role: 'CUSTOMER' });
      expect(me.body).not.toHaveProperty('passwordHash');
    });
    it('email trùng → 409, sai mật khẩu → 401, dữ liệu sai → 400', async () => {
      await ctx.http().post('/auth/register').send({ email: 'a@test.local', password: 'secret123' }).expect(409);
      await ctx.http().post('/auth/login').send({ email: 'a@test.local', password: 'wrong-pass' }).expect(401);
      await ctx.http().post('/auth/register').send({ email: 'not-an-email', password: '123' }).expect(400);
    });
    it('guard: đặt đơn không có token → 401, token sai → 401', async () => {
      await ctx.http().post('/orders').send({ items: [] }).expect(401);
      await ctx.http().get('/orders/me').set(auth('bad.token.value')).expect(401);
    });
  });

  describe('Task 6 – POST /orders', () => {
    it('server tự tính giá, lưu PENDING, trừ kho, trả mã đơn', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10, 45000);
      const res = await ctx.http().post('/orders').set(auth(u.token))
        .send({ items: [item(p.id, 2, 'L', ['PEARL']), item(p.id, 1, 'S')] }).expect(201);
      // L + trân châu = 45000+7000+5000 = 57000 x2 ; S = 40000
      expect(res.body.subtotal).toBe(57000 * 2 + 40000);
      expect(res.body).toMatchObject({ status: 'PENDING', discount: 0, code: `#${res.body.id}` });
      expect(res.body.total).toBe(154000);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: p.id })).stock).toBe(7);
    });
    it('validate đầu vào: giỏ rỗng, size sai, số lượng sai, thuộc tính lạ, sản phẩm không tồn tại', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10);
      const post = (b: any) => ctx.http().post('/orders').set(auth(u.token)).send(b);
      await post({ items: [] }).expect(400);
      await post({ items: [item(p.id, 1, 'XL')] }).expect(400);
      await post({ items: [item(p.id, 0)] }).expect(400);
      await post({ items: [item(p.id, 1, 'M', ['NOPE'])] }).expect(400);
      await post({ items: [{ ...item(p.id), unitPrice: 1 }] }).expect(400); // không tin giá từ client
      await post({ items: [item(999999)] }).expect(400);
    });
    it('GET /orders/me chỉ trả đơn của chính mình', async () => {
      const a = await registerUser(ctx, 'a'); const b = await registerUser(ctx, 'b');
      const p = await createProduct(ctx, 10);
      const o = await ctx.http().post('/orders').set(auth(a.token)).send({ items: [item(p.id)] }).expect(201);
      const mineA = await ctx.http().get('/orders/me').set(auth(a.token)).expect(200);
      const mineB = await ctx.http().get('/orders/me').set(auth(b.token)).expect(200);
      expect(mineA.body.map((x: any) => x.id)).toContain(o.body.id);
      expect(mineB.body).toHaveLength(0);
      await ctx.http().get(`/orders/${o.body.id}`).set(auth(b.token)).expect(403);
    });
  });

  describe('Task 8 – thanh toán', () => {
    it('thành công → PAID; thiếu Idempotency-Key → 400', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10, 45000);
      const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id)] }).expect(201);
      await ctx.http().post('/payments').set(auth(u.token)).send({ orderId: o.body.id, method: 'WALLET' }).expect(400);
      const pay = await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', `k-${o.body.id}`)
        .send({ orderId: o.body.id, method: 'WALLET' }).expect(201);
      expect(pay.body).toMatchObject({ success: true, payment: { status: 'SUCCESS', amount: 45000 }, order: { status: 'PAID' } });
    });
    it('lỗi → PAYMENT_FAILED (402), giữ nguyên đơn, thử lại bằng key mới → PAID', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10);
      const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id)] }).expect(201);
      const fail = await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', `f-${o.body.id}`)
        .send({ orderId: o.body.id, method: 'CARD', simulateFailure: true }).expect(402);
      expect(fail.body).toMatchObject({ success: false, order: { status: 'PAYMENT_FAILED' } });
      const retry = await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', `r-${o.body.id}`)
        .send({ orderId: o.body.id, method: 'CARD' }).expect(201);
      expect(retry.body.order.status).toBe('PAID');
    });
    it('không thanh toán lại đơn đã PAID (key khác) → 409; đơn người khác → 400', async () => {
      const u = await registerUser(ctx); const other = await registerUser(ctx);
      const p = await createProduct(ctx, 10);
      const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id)] }).expect(201);
      await ctx.http().post('/payments').set(auth(other.token)).set('Idempotency-Key', 'steal').send({ orderId: o.body.id, method: 'WALLET' }).expect(400);
      await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', `a-${o.body.id}`).send({ orderId: o.body.id, method: 'WALLET' }).expect(201);
      await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', `b-${o.body.id}`).send({ orderId: o.body.id, method: 'WALLET' }).expect(409);
    });
  });

  describe('Task 10.1 – Order State Machine (qua API)', () => {
    async function paidOrder() {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10);
      const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id)] }).expect(201);
      const pending = o.body.id as number;
      return { u, p, id: pending, pay: () => ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', `p-${pending}`).send({ orderId: pending, method: 'WALLET' }) };
    }
    it('(a) chặn chuyển trạng thái sai: PENDING→READY, PAID→READY, COMPLETED→PREPARING đều 409', async () => {
      const staff = await createStaff(ctx);
      const o = await paidOrder();
      const set = (s: string) => ctx.http().patch(`/orders/${o.id}/status`).set(auth(staff.token)).send({ status: s });
      await set('READY').expect(409);        // PENDING → READY
      await set('PREPARING').expect(409);    // PENDING → PREPARING
      await o.pay().expect(201);
      const bad = await set('READY').expect(409); // PAID → READY (nhảy cóc)
      expect(bad.body.code).toBe('INVALID_TRANSITION');
      await set('PREPARING').expect(200);
      await set('READY').expect(200);
      await set('COMPLETED').expect(200);
      await set('PREPARING').expect(409);    // trạng thái kết thúc
      await set('CANCELLED').expect(409);
    });
    it('khách không có quyền cập nhật trạng thái pha chế (403); nhân viên không được đặt PAID tay (400)', async () => {
      const staff = await createStaff(ctx);
      const o = await paidOrder();
      await ctx.http().patch(`/orders/${o.id}/status`).set(auth(o.u.token)).send({ status: 'PREPARING' }).expect(403);
      await ctx.http().patch(`/orders/${o.id}/status`).set(auth(staff.token)).send({ status: 'PAID' }).expect(400);
    });
    it('hủy đơn nhả kho; không hủy được đơn đã hủy', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 5);
      const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id, 3)] }).expect(201);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: p.id })).stock).toBe(2);
      await ctx.http().post(`/orders/${o.body.id}/cancel`).set(auth(u.token)).expect(201);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: p.id })).stock).toBe(5);
      await ctx.http().post(`/orders/${o.body.id}/cancel`).set(auth(u.token)).expect(409);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: p.id })).stock).toBe(5);
    });
  });

  describe('Task 10.2 – thanh toán / tạo đơn idempotent', () => {
    it('(b) POST /orders gửi 2 lần cùng Idempotency-Key (tuần tự) chỉ tạo 1 đơn, trừ kho 1 lần', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10);
      const send = () => ctx.http().post('/orders').set(auth(u.token)).set('Idempotency-Key', 'order-key-1').send({ items: [item(p.id, 2)] });
      const first = await send().expect(201);
      const second = await send().expect(200);
      expect(second.headers['idempotent-replayed']).toBe('true');
      expect(second.body.id).toBe(first.body.id);
      expect((await ctx.http().get('/orders/me').set(auth(u.token))).body).toHaveLength(1);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: p.id })).stock).toBe(8);
    });
    it('(b) POST /orders 5 yêu cầu ĐỒNG THỜI cùng key chỉ tạo 1 đơn', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10);
      const results = await Promise.all(Array.from({ length: 5 }, () =>
        ctx.http().post('/orders').set(auth(u.token)).set('Idempotency-Key', 'order-key-par').send({ items: [item(p.id, 1)] })));
      expect(results.every((r) => [200, 201].includes(r.status))).toBe(true);
      expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
      expect((await ctx.http().get('/orders/me').set(auth(u.token))).body).toHaveLength(1);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: p.id })).stock).toBe(9);
    });
    it('(b) POST /payments gửi lặp / đồng thời cùng key: 1 giao dịch, điểm thưởng cộng 1 lần', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10, 45000);
      const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id, 3)] }).expect(201); // 135000
      const pay = () => ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', 'pay-key-par').send({ orderId: o.body.id, method: 'WALLET' });
      const results = await Promise.all([pay(), pay(), pay(), pay()]);
      expect(results.every((r) => [200, 201].includes(r.status))).toBe(true);
      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect(new Set(results.map((r) => r.body.payment.id)).size).toBe(1);
      const later = await pay().expect(200);
      expect(later.body.replayed).toBe(true);
      const count = await ctx.ds.query('SELECT count(*)::int AS n FROM payments WHERE "orderId" = $1', [o.body.id]);
      expect(count[0].n).toBe(1);
      const me = await ctx.http().get('/auth/me').set(auth(u.token));
      expect(me.body.loyaltyPoints).toBe(13); // floor(135000/10000)
    });
    it('cùng Idempotency-Key nhưng dùng cho đơn khác → 409', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10);
      const o1 = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id)] }).expect(201);
      const o2 = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id)] }).expect(201);
      await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', 'same').send({ orderId: o1.body.id, method: 'WALLET' }).expect(201);
      await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', 'same').send({ orderId: o2.body.id, method: 'WALLET' }).expect(409);
    });
  });

  describe('Task 10.3 – tồn kho khi đặt đồng thời', () => {
    it('(c) 12 khách đặt cùng lúc 1 sản phẩm còn 5 → đúng 5 đơn thành công, kho về 0 (không âm)', async () => {
      const p = await createProduct(ctx, 5);
      const users = await Promise.all(Array.from({ length: 12 }, (_, i) => registerUser(ctx, `race${i}`)));
      const results = await Promise.all(users.map((u) =>
        ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id, 1)] })));
      const ok = results.filter((r) => r.status === 201);
      const rejected = results.filter((r) => r.status === 409);
      expect(ok).toHaveLength(5);
      expect(rejected).toHaveLength(7);
      expect(rejected[0].body.code).toBe('OUT_OF_STOCK');
      const row = await ctx.ds.manager.findOneByOrFail(Product, { id: p.id });
      expect(row.stock).toBe(0);
      expect(row.version).toBeGreaterThanOrEqual(6); // optimistic lock: mỗi lần trừ kho tăng version
      const sold = await ctx.ds.query('SELECT coalesce(sum(qty),0)::int AS n FROM order_items WHERE "productId" = $1', [p.id]);
      expect(sold[0].n).toBe(5);
    });
    it('(c) đơn nhiều số lượng: kho 7, 6 khách mua 2 ly → tối đa 3 đơn, không vượt kho', async () => {
      const p = await createProduct(ctx, 7);
      const users = await Promise.all(Array.from({ length: 6 }, (_, i) => registerUser(ctx, `multi${i}`)));
      const results = await Promise.all(users.map((u) => ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id, 2)] })));
      expect(results.filter((r) => r.status === 201)).toHaveLength(3);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: p.id })).stock).toBe(1);
    });
    it('đơn thất bại giữa chừng được rollback toàn bộ (không trừ kho sản phẩm khác)', async () => {
      const u = await registerUser(ctx);
      const a = await createProduct(ctx, 10); const b = await createProduct(ctx, 1);
      await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(a.id, 3), item(b.id, 2)] }).expect(409);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: a.id })).stock).toBe(10);
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: b.id })).stock).toBe(1);
    });
  });

  describe('Task 10.4 – khuyến mãi & điểm thưởng', () => {
    it('áp mã hợp lệ, cộng điểm sau khi PAID, không cộng khi thanh toán lỗi', async () => {
      await createCoupon(ctx, { code: 'TEST10', percentOff: 10 });
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10, 50000);
      const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id, 4)], couponCode: 'test10' }).expect(201);
      expect(o.body).toMatchObject({ subtotal: 200000, discount: 20000, total: 180000, couponCode: 'TEST10' });
      await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', 'lf').send({ orderId: o.body.id, method: 'CARD', simulateFailure: true }).expect(402);
      expect((await ctx.http().get('/auth/me').set(auth(u.token))).body.loyaltyPoints).toBe(0);
      await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', 'ls').send({ orderId: o.body.id, method: 'CARD' }).expect(201);
      expect((await ctx.http().get('/auth/me').set(auth(u.token))).body.loyaltyPoints).toBe(18);
    });
    it('hủy đơn đã thanh toán thu hồi đúng số điểm đã cộng (một lần), không để điểm âm', async () => {
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10, 50000);
      const o = await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id, 2)] }).expect(201);
      await ctx.http().post('/payments').set(auth(u.token)).set('Idempotency-Key', 'rv1').send({ orderId: o.body.id, method: 'WALLET' }).expect(201);
      expect((await ctx.http().get('/auth/me').set(auth(u.token))).body.loyaltyPoints).toBe(10);
      await ctx.http().post(`/orders/${o.body.id}/cancel`).set(auth(u.token)).expect(201);
      expect((await ctx.http().get('/auth/me').set(auth(u.token))).body.loyaltyPoints).toBe(0);
      await ctx.http().post(`/orders/${o.body.id}/cancel`).set(auth(u.token)).expect(409); // hủy lần hai không trừ thêm
      expect((await ctx.http().get('/auth/me').set(auth(u.token))).body.loyaltyPoints).toBe(0);
    });
    it('từ chối mã không tồn tại / hết hạn / chưa đủ đơn tối thiểu', async () => {
      await createCoupon(ctx, { code: 'OLD', percentOff: 10, expiresAt: new Date('2020-01-01') });
      await createCoupon(ctx, { code: 'BIG', percentOff: 10, minTotal: 500000 });
      const u = await registerUser(ctx);
      const p = await createProduct(ctx, 10);
      for (const code of ['NOPE', 'OLD', 'BIG']) {
        await ctx.http().post('/orders').set(auth(u.token)).send({ items: [item(p.id)], couponCode: code }).expect(400);
      }
      expect((await ctx.ds.manager.findOneByOrFail(Product, { id: p.id })).stock).toBe(10);
    });
  });
});
