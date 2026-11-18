import { beforeEach, describe, expect, it } from 'vitest';
import { cartCount, cartTotal, useCart } from '@/lib/store';

const latte = { productId: 5, name: 'Latte', imageUrl: '', size: 'L' as const, toppings: ['PEARL'], qty: 1, unitPrice: 57000 };

describe('FE-T02 Giỏ hàng', () => {
  beforeEach(() => useCart.getState().clear());

  it('gộp cùng món, cùng size, cùng topping (không phụ thuộc thứ tự topping) thành một dòng', () => {
    useCart.getState().add(latte);
    useCart.getState().add({ ...latte, qty: 2 });
    useCart.getState().add({ ...latte, toppings: ['CREAM', 'PEARL'] });
    useCart.getState().add({ ...latte, toppings: ['PEARL', 'CREAM'] });
    const items = useCart.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].qty).toBe(3);
    expect(items[1].qty).toBe(2);
  });

  it('tính tổng tiền và tổng số ly', () => {
    useCart.getState().add({ ...latte, qty: 2 });
    useCart.getState().add({ ...latte, size: 'S', toppings: [], unitPrice: 40000 });
    const items = useCart.getState().items;
    expect(cartTotal(items)).toBe(2 * 57000 + 40000);
    expect(cartCount(items)).toBe(3);
  });

  it('giới hạn tối đa 20 ly mỗi dòng; số lượng 0 thì xoá dòng', () => {
    useCart.getState().add({ ...latte, qty: 15 });
    useCart.getState().add({ ...latte, qty: 15 });
    const key = useCart.getState().items[0].key;
    expect(useCart.getState().items[0].qty).toBe(20);
    useCart.getState().setQty(key, 0);
    expect(useCart.getState().items).toHaveLength(0);
  });
});
