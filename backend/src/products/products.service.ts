import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SIZES, TOPPINGS } from '../common/catalog';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private readonly repo: Repository<Product>) {}

  /** Task 2: danh sách menu (id, tên, giá, ảnh...). */
  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  /** Chi tiết sản phẩm kèm tuỳ chọn size/topping (Task 4). */
  async findOne(id: number) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Không tìm thấy sản phẩm');
    return { ...p, options: { sizes: SIZES, toppings: TOPPINGS } };
  }
}
