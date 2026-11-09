import { assertTransition, canTransition, InvalidOrderTransitionError, ORDER_TRANSITIONS, OrderStatus } from '../../src/orders/order-status';

const S = OrderStatus;
const ALLOWED: [OrderStatus, OrderStatus][] = [
  [S.PENDING, S.PAID], [S.PENDING, S.PAYMENT_FAILED], [S.PENDING, S.CANCELLED],
  [S.PAYMENT_FAILED, S.PENDING], [S.PAYMENT_FAILED, S.CANCELLED],
  [S.PAID, S.PREPARING], [S.PAID, S.CANCELLED],
  [S.PREPARING, S.READY], [S.READY, S.COMPLETED],
];

describe('Order State Machine', () => {
  it('cho phép đúng các chuyển tiếp hợp lệ', () => {
    for (const [a, b] of ALLOWED) {
      expect(canTransition(a, b)).toBe(true);
      expect(() => assertTransition(a, b)).not.toThrow();
    }
  });

  it('(a) chặn mọi chuyển tiếp không nằm trong sơ đồ (kiểm tra toàn bộ 49 cặp)', () => {
    const all = Object.values(OrderStatus);
    let blocked = 0;
    for (const a of all) {
      for (const b of all) {
        if (ALLOWED.some(([x, y]) => x === a && y === b)) continue;
        expect(canTransition(a, b)).toBe(false);
        expect(() => assertTransition(a, b)).toThrow(InvalidOrderTransitionError);
        blocked++;
      }
    }
    expect(blocked).toBe(all.length * all.length - ALLOWED.length);
  });

  it('COMPLETED và CANCELLED là trạng thái kết thúc', () => {
    expect(ORDER_TRANSITIONS[S.COMPLETED]).toHaveLength(0);
    expect(ORDER_TRANSITIONS[S.CANCELLED]).toHaveLength(0);
  });

  it('không được nhảy cóc: PENDING → READY / PAID → COMPLETED bị chặn', () => {
    expect(() => assertTransition(S.PENDING, S.READY)).toThrow(/PENDING sang READY/);
    expect(() => assertTransition(S.PAID, S.COMPLETED)).toThrow();
  });
});
