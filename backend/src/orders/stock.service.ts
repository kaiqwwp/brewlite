import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Product } from '../entities/product.entity';

const MAX_RETRIES = 8;

/**
 * Kiểm soát tồn kho khi đặt đồng thời (Task 10.3):
 * transaction + optimistic locking (cột version). Mỗi lần trừ kho chỉ thành công nếu
 * `version` chưa bị giao dịch khác thay đổi và `stock` còn đủ; nếu không thì đọc lại và thử lại.
 */
@Injectable()
export class StockService {
  /** wanted: productId -> tổng số lượng cần giữ. Sắp theo id để tránh deadlock. */
  async reserve(m: EntityManager, wanted: Map<number, number>): Promise<void> {
    const ids = [...wanted.keys()].sort((a, b) => a - b);
    for (const id of ids) await this.reserveOne(m, id, wanted.get(id)!);
  }

  private async reserveOne(m: EntityManager, id: number, qty: number): Promise<void> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const p = await m.findOne(Product, { where: { id } });
      if (!p) throw new NotFoundException(`Sản phẩm #${id} không tồn tại`);
      if (p.stock < qty) {
        throw new ConflictException({
          statusCode: 409,
          code: 'OUT_OF_STOCK',
          message: `${p.name} không đủ hàng (còn ${p.stock})`,
        });
      }
      const res = await m.update(
        Product,
        { id, version: p.version },
        { stock: p.stock - qty, version: p.version + 1 },
      );
      if (res.affected === 1) return;
      // version đã đổi (giao dịch khác thắng) → đọc lại và thử lại
    }
    throw new ConflictException({ statusCode: 409, code: 'CONTENTION', message: 'Hệ thống đang bận, vui lòng thử lại' });
  }

  async release(m: EntityManager, wanted: Map<number, number>): Promise<void> {
    const ids = [...wanted.keys()].sort((a, b) => a - b);
    for (const id of ids) {
      await m.createQueryBuilder().update(Product).set({ stock: () => `stock + ${Number(wanted.get(id))}` }).where('id = :id', { id }).execute();
    }
  }
}
