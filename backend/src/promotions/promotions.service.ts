import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Coupon } from '../entities/coupon.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';

export const POINT_UNIT = 10000; // mỗi 10.000đ thanh toán = 1 điểm

/** Hàm thuần: tính số tiền giảm. Ném lỗi nếu mã không hợp lệ. */
export function computeDiscount(coupon: Coupon | null, subtotal: number, now = new Date()): number {
  if (!coupon || !coupon.active) throw new BadRequestException('Mã giảm giá không hợp lệ');
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    throw new BadRequestException('Mã giảm giá đã hết hạn');
  }
  if (subtotal < coupon.minTotal) {
    throw new BadRequestException(`Đơn tối thiểu ${coupon.minTotal}đ để dùng mã ${coupon.code}`);
  }
  let discount = Math.floor((subtotal * coupon.percentOff) / 100);
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  return Math.min(discount, subtotal);
}

export function pointsFor(total: number): number {
  return Math.floor(total / POINT_UNIT);
}

@Injectable()
export class PromotionsService {
  async discountFor(m: EntityManager, code: string | undefined, subtotal: number): Promise<number> {
    if (!code) return 0;
    const coupon = await m.findOne(Coupon, { where: { code: code.trim().toUpperCase() } });
    return computeDiscount(coupon, subtotal);
  }

  /** Cộng điểm thưởng đúng 1 lần cho mỗi đơn khi đơn chuyển sang PAID. */
  async awardPoints(m: EntityManager, order: Order): Promise<number> {
    const points = pointsFor(order.total);
    const flag = await m.update(Order, { id: order.id, pointsAwarded: false }, { pointsAwarded: true });
    if (flag.affected !== 1 || points <= 0) return 0;
    await m.increment(User, { id: order.userId }, 'loyaltyPoints', points);
    return points;
  }
}
