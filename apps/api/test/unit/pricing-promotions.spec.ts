import { BadRequestException } from '@nestjs/common';
import { unitPrice } from '../../src/common/catalog';
import { Promotion } from '../../src/entities/promotion.entity';
import { computeDiscount, pointsFor } from '../../src/promotions/promotions.service';

const coupon = (o: Partial<Promotion> = {}) =>
  Object.assign(new Promotion(), { code: 'X', percentOff: 10, minTotal: 0, maxDiscount: null, active: true, expiresAt: null }, o);

describe('Tính giá', () => {
  it('UT-05 size M không đổi giá, S giảm, L tăng', () => {
    expect(unitPrice(45000, 'M')).toBe(45000);
    expect(unitPrice(45000, 'S')).toBe(40000);
    expect(unitPrice(45000, 'L')).toBe(52000);
  });
  it('UT-06 cộng giá topping, bỏ trùng lặp', () => {
    expect(unitPrice(39000, 'M', ['PEARL'])).toBe(44000);
    expect(unitPrice(39000, 'L', ['PEARL', 'CREAM', 'PEARL'])).toBe(39000 + 7000 + 5000 + 7000);
  });
  it('UT-07 ném lỗi với size/topping không hợp lệ', () => {
    expect(() => unitPrice(1000, 'XL')).toThrow();
    expect(() => unitPrice(1000, 'M', ['NOPE'])).toThrow();
  });
});

describe('Khuyến mãi & điểm thưởng', () => {
  it('UT-08 giảm theo phần trăm, làm tròn xuống', () => {
    expect(computeDiscount(coupon(), 123000)).toBe(12300);
  });
  it('UT-09 áp dụng trần giảm giá', () => {
    expect(computeDiscount(coupon({ maxDiscount: 5000 }), 123000)).toBe(5000);
  });
  it('UT-10 từ chối mã null, vô hiệu, hết hạn, chưa đủ đơn tối thiểu', () => {
    expect(() => computeDiscount(null, 1000)).toThrow(BadRequestException);
    expect(() => computeDiscount(coupon({ active: false }), 1000)).toThrow(BadRequestException);
    expect(() => computeDiscount(coupon({ expiresAt: new Date('2020-01-01') }), 1000)).toThrow(/hết hạn/);
    expect(() => computeDiscount(coupon({ minTotal: 100000 }), 50000)).toThrow(/tối thiểu/);
  });
  it('UT-11 1 điểm cho mỗi 10.000đ', () => {
    expect(pointsFor(9999)).toBe(0);
    expect(pointsFor(123000)).toBe(12);
  });
});
