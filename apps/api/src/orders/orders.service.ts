import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import { unitPrice } from '../common/catalog';
import { isUniqueViolation } from '../common/db-errors';
import { AuthUser } from '../common/current-user';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { PromotionsService } from '../promotions/promotions.service';
import { CreateOrderDto } from './dto';
import { assertTransition, OrderStatus } from './order-status';
import { StockService } from './stock.service';

export const orderView = (o: Order) => ({
  id: o.id,
  code: `#${o.id}`,
  status: o.status,
  subtotal: o.subtotal,
  discount: o.discount,
  total: o.total,
  couponCode: o.couponCode,
  createdAt: o.createdAt,
  items: (o.items ?? []).map((i) => ({
    id: i.id, productId: i.productId, productName: i.productName, size: i.size,
    toppings: i.toppings ?? [], qty: i.qty, unitPrice: i.unitPrice, lineTotal: i.lineTotal,
  })),
});

@Injectable()
export class OrdersService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly stock: StockService,
    private readonly promos: PromotionsService,
  ) {}

  // ------------------------------------------------------------------ Task 6
  /**
   * Tạo đơn PENDING: validate, server tự tính giá, trừ kho (optimistic locking) và lưu trong 1 transaction.
   * Có Idempotency-Key thì gửi lại cùng key trả lại đúng đơn cũ (replayed = true).
   */
  async create(userId: number, dto: CreateOrderDto, idempotencyKey?: string) {
    if (idempotencyKey) {
      const prior = await this.findByKey(userId, idempotencyKey);
      if (prior) return { replayed: true, order: orderView(prior) };
    }
    try {
      const order = await this.ds.transaction((m) => this.createInTx(m, userId, dto, idempotencyKey));
      return { replayed: false, order: orderView(order) };
    } catch (e) {
      // Yêu cầu song song cùng key: transaction thua đã rollback (kho được hoàn lại) → trả đơn của bên thắng
      if (idempotencyKey && isUniqueViolation(e)) {
        const prior = await this.findByKey(userId, idempotencyKey);
        if (prior) return { replayed: true, order: orderView(prior) };
      }
      throw e;
    }
  }

  private async createInTx(m: EntityManager, userId: number, dto: CreateOrderDto, key?: string) {
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await m.find(Product, { where: { id: In(ids) } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const wanted = new Map<number, number>();
    const items = dto.items.map((it) => {
      const p = byId.get(it.productId);
      if (!p) throw new BadRequestException(`Sản phẩm #${it.productId} không tồn tại`);
      let price: number;
      try {
        price = unitPrice(p.price, it.size, it.toppings ?? []);
      } catch (err) {
        throw new BadRequestException((err as Error).message);
      }
      wanted.set(p.id, (wanted.get(p.id) ?? 0) + it.qty);
      return m.create(OrderItem, {
        productId: p.id, productName: p.name, size: it.size,
        toppings: [...new Set(it.toppings ?? [])], qty: it.qty, unitPrice: price, lineTotal: price * it.qty,
      });
    });

    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const discount = await this.promos.discountFor(m, dto.couponCode, subtotal);

    await this.stock.reserve(m, wanted); // Task 10.3

    const order = await m.save(
      Order,
      m.create(Order, {
        userId, status: OrderStatus.PENDING, subtotal, discount, total: subtotal - discount,
        couponCode: discount > 0 || dto.couponCode ? dto.couponCode!.trim().toUpperCase() : null,
        idempotencyKey: key ?? null, items,
      }),
    );
    return order;
  }

  // ------------------------------------------------------------- Task 10.1
  /**
   * Chuyển trạng thái trong transaction `m` (đơn phải đã được lock dòng).
   * Mọi chuyển tiếp không hợp lệ bị assertTransition chặn. Hủy đơn sẽ nhả kho.
   */
  async transition(m: EntityManager, order: Order, to: OrderStatus): Promise<Order> {
    assertTransition(order.status, to);
    if (to === OrderStatus.CANCELLED) {
      const items = await m.find(OrderItem, { where: { orderId: order.id } });
      const wanted = new Map<number, number>();
      for (const i of items) wanted.set(i.productId, (wanted.get(i.productId) ?? 0) + i.qty);
      await this.stock.release(m, wanted);
      await this.promos.revokePoints(m, order); // hủy đơn đã thanh toán → thu hồi điểm thưởng
    }
    await m.update(Order, { id: order.id }, { status: to });
    order.status = to;
    if (to === OrderStatus.PAID) await this.promos.awardPoints(m, order); // Task 10.4
    return order;
  }

  async lockOrder(m: EntityManager, id: number): Promise<Order | null> {
    return m.findOne(Order, { where: { id }, lock: { mode: 'pessimistic_write' } });
  }

  /** Nhân viên cập nhật trạng thái pha chế; không được đặt PAID/PENDING/PAYMENT_FAILED bằng tay. */
  async staffUpdate(id: number, to: OrderStatus) {
    if (![OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(to)) {
      throw new BadRequestException(`Nhân viên không được đặt trạng thái ${to} thủ công`);
    }
    return this.changeStatus(id, to);
  }

  async cancel(id: number, user: AuthUser) {
    const order = await this.ds.getRepository(Order).findOne({ where: { id } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn');
    if (order.userId !== user.id && user.role !== 'STAFF') throw new ForbiddenException('Không phải đơn của bạn');
    return this.changeStatus(id, OrderStatus.CANCELLED);
  }

  private async changeStatus(id: number, to: OrderStatus) {
    await this.ds.transaction(async (m) => {
      const order = await this.lockOrder(m, id);
      if (!order) throw new NotFoundException('Không tìm thấy đơn');
      await this.transition(m, order, to);
    });
    return orderView(await this.mustFind(id));
  }

  // ------------------------------------------------------------- truy vấn
  private mustFind(id: number) {
    return this.ds.getRepository(Order).findOneOrFail({ where: { id }, relations: { items: true } });
  }

  private findByKey(userId: number, key: string) {
    return this.ds.getRepository(Order).findOne({ where: { userId, idempotencyKey: key }, relations: { items: true } });
  }

  /** Task 9: lịch sử đơn của user (mới nhất trước). */
  async history(userId: number) {
    const rows = await this.ds.getRepository(Order).find({
      where: { userId }, relations: { items: true }, order: { id: 'DESC' },
    });
    return rows.map(orderView);
  }

  async findOne(id: number, user: AuthUser) {
    const o = await this.ds.getRepository(Order).findOne({ where: { id }, relations: { items: true } });
    if (!o) throw new NotFoundException('Không tìm thấy đơn');
    if (o.userId !== user.id && user.role !== 'STAFF') throw new ForbiddenException('Không phải đơn của bạn');
    return orderView(o);
  }

  /** Dùng cho PaymentsService: nạp đơn + items. */
  async view(id: number) {
    return orderView(await this.mustFind(id));
  }
}
