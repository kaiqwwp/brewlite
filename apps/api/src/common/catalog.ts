/** Danh mục tuỳ chọn size/topping. Giá luôn được tính phía server, không tin client. */
export const SIZES = [
  { code: 'S', label: 'Nhỏ', delta: -5000 },
  { code: 'M', label: 'Vừa', delta: 0 },
  { code: 'L', label: 'Lớn', delta: 7000 },
] as const;

export type SizeCode = (typeof SIZES)[number]['code'];
export const SIZE_CODES = SIZES.map((s) => s.code) as SizeCode[];

export const TOPPINGS = [
  { code: 'PEARL', name: 'Trân châu', price: 5000 },
  { code: 'CREAM', name: 'Kem', price: 7000 },
  { code: 'JELLY', name: 'Thạch dừa', price: 5000 },
  { code: 'SHOT', name: 'Espresso shot', price: 10000 },
] as const;
export const TOPPING_CODES = TOPPINGS.map((t) => t.code) as string[];

export function sizeDelta(size: string): number {
  const s = SIZES.find((x) => x.code === size);
  if (!s) throw new Error(`Size không hợp lệ: ${size}`);
  return s.delta;
}

/** Đơn giá 1 ly = giá gốc (size M) + chênh lệch size + tổng giá topping (mỗi topping tính 1 lần). */
export function unitPrice(basePrice: number, size: string, toppings: string[] = []): number {
  const unique = [...new Set(toppings)];
  const toppingTotal = unique.reduce((sum, code) => {
    const t = TOPPINGS.find((x) => x.code === code);
    if (!t) throw new Error(`Topping không hợp lệ: ${code}`);
    return sum + t.price;
  }, 0);
  return basePrice + sizeDelta(size) + toppingTotal;
}
