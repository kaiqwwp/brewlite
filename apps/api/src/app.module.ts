import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Coupon } from './entities/coupon.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { Payment } from './entities/payment.entity';
import { Product } from './entities/product.entity';
import { User } from './entities/user.entity';
import { HealthController } from './health/health.controller';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { SeedService } from './seed/seed.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Cấu hình đọc từ biến môi trường tại thời điểm khởi tạo (xem .env.example)
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/brewlite',
        entities: [User, Product, Order, OrderItem, Payment, Coupon],
        synchronize: process.env.DB_SYNC !== 'false', // đồ án: tự tạo bảng; production nên dùng migration
        dropSchema: process.env.DB_DROP === 'true', // chỉ dùng cho test
      }),
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
  providers: [SeedService],
})
export class AppModule {}
