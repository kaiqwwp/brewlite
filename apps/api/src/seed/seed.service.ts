import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Promotion } from '../entities/promotion.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';

const PRODUCTS = [
  { name: 'Cà phê sữa', price: 35000, imageUrl: '/images/ca-phe-sua.svg', description: 'Cà phê phin đậm vị, sữa đặc béo ngọt.' },
  { name: 'Americano', price: 40000, imageUrl: '/images/americano.svg', description: 'Espresso pha loãng, thanh và đậm hương.' },
  { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.svg', description: 'Espresso, sữa nóng và lớp bọt sữa mịn.' },
  { name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.svg', description: 'Trà đen, đào miếng và sả thơm mát.' },
  { name: 'Latte', price: 45000, imageUrl: '/images/latte.svg', description: 'Espresso hòa cùng nhiều sữa tươi.' },
  { name: 'Bạc xỉu', price: 38000, imageUrl: '/images/bac-xiu.svg', description: 'Nhiều sữa, ít cà phê, ngọt dịu.' },
  { name: 'Trà vải', price: 39000, imageUrl: '/images/tra-vai.svg', description: 'Trà hoa nhài, vải thiều và hương hoa hồng.' },
  { name: 'Matcha đá xay', price: 55000, imageUrl: '/images/matcha.svg', description: 'Matcha Nhật xay lạnh cùng kem sữa.' },
];

/** Nạp dữ liệu mẫu khi CSDL rỗng (tắt bằng SEED=false). */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly log = new Logger('Seed');
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onApplicationBootstrap() {
    if (process.env.SEED === 'false') return;
    const m = this.ds.manager;
    if ((await m.count(Product)) === 0) {
      await m.save(Product, PRODUCTS.map((p) => m.create(Product, { ...p, stock: 100 })));
      this.log.log(`Đã nạp ${PRODUCTS.length} sản phẩm mẫu`);
    }
    if ((await m.count(Promotion)) === 0) {
      await m.save(Promotion, [
        m.create(Promotion, { code: 'BREW10', percentOff: 10, minTotal: 0, maxDiscount: 20000, active: true }),
        m.create(Promotion, { code: 'WELCOME20', percentOff: 20, minTotal: 100000, maxDiscount: 50000, active: true }),
      ]);
    }
    const staffEmail = process.env.STAFF_EMAIL ?? 'staff@brewlite.local';
    if (!(await m.findOne(User, { where: { email: staffEmail } }))) {
      await m.save(User, m.create(User, {
        email: staffEmail, name: 'Barista', role: 'STAFF',
        passwordHash: await bcrypt.hash(process.env.STAFF_PASSWORD ?? 'staff123', 10),
      }));
    }
  }
}
