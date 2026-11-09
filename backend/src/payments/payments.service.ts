import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors';
import { Order } from '../entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { OrderStatus } from '../orders/order-status';
import { OrdersService } from '../orders/orders.service';
import { PayDto } from './dto';
import { MockPaymentGateway } from './mock-gateway';

export interface PayResult { replayed: boolean; payment: Payment }

@Injectable()
export class PaymentsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly orders: OrdersService,
    private readonly gateway: MockPaymentGateway,
  ) {}

  /**
   * Thanh toán idempotent (Task 8 + Task 10.2).
   * Cùng Idempotency-Key ⇒ trả lại đúng kết quả lần đầu, không tính tiền / đổi trạng thái lần hai.
   * Yêu cầu đồng thời được xếp hàng nhờ khóa dòng đơn (SELECT ... FOR UPDATE) + ràng buộc UNIQUE.
   */
  async pay(userId: number, key: string, dto: PayDto): Promise<PayResult> {
    const prior = await this.ds.getRepository(Payment).findOne({ where: { idempotencyKey: key } });
    if (prior) return this.replay(prior, userId, dto);

    try {
      return await this.ds.transaction(async (m) => {
        const order = await this.orders.lockOrder(m, dto.orderId);
        if (!order || order.userId !== userId) throw new BadRequestException('Đơn hàng không hợp lệ');

        // Kiểm tra lại sau khi giữ khóa: yêu cầu song song cùng key có thể vừa hoàn tất
        const again = await m.findOne(Payment, { where: { idempotencyKey: key } });
        if (again) return this.replay(again, userId, dto);

        if (order.status === OrderStatus.PAYMENT_FAILED) await this.orders.transition(m, order, OrderStatus.PENDING); // thử lại
        if (order.status !== OrderStatus.PENDING) {
          throw new ConflictException({
            statusCode: 409, code: 'ORDER_NOT_PAYABLE',
            message: `Đơn đang ở trạng thái ${order.status}, không thể thanh toán`,
          });
        }

        const result = await this.gateway.charge({
          amount: order.total, method: dto.method, simulateFailure: dto.simulateFailure,
        });
        await this.orders.transition(m, order, result.ok ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED);
        const payment = await m.save(
          Payment,
          m.create(Payment, {
            orderId: order.id, userId, idempotencyKey: key, amount: order.total, method: dto.method,
            status: result.ok ? 'SUCCESS' : 'FAILED', reference: result.reference, failureReason: result.reason ?? null,
          }),
        );
        return { replayed: false, payment };
      });
    } catch (e) {
      if (isUniqueViolation(e)) {
        const existing = await this.ds.getRepository(Payment).findOne({ where: { idempotencyKey: key } });
        if (existing) return this.replay(existing, userId, dto);
      }
      throw e;
    }
  }

  private replay(prior: Payment, userId: number, dto: PayDto): PayResult {
    if (prior.userId !== userId || prior.orderId !== dto.orderId) {
      throw new ConflictException({
        statusCode: 409, code: 'IDEMPOTENCY_KEY_REUSED',
        message: 'Idempotency-Key này đã được dùng cho một yêu cầu khác',
      });
    }
    return { replayed: true, payment: prior };
  }

  view(orderId: number) {
    return this.orders.view(orderId);
  }
}
