import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RequestLogger } from './common/request-logger';
import { dataSourceOptions } from './database/data-source';
import { HealthController } from './health/health.controller';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { SeedService } from './seed/seed.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Cấu hình đọc từ biến môi trường lúc khởi tạo (xem .env.example).
    // Schema được tạo và nâng cấp bằng migration, chạy tự động khi khởi động (DB_MIGRATE=false để tắt).
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dataSourceOptions(),
        migrationsRun: process.env.DB_MIGRATE !== 'false',
        dropSchema: process.env.DB_DROP === 'true', // chỉ dùng cho test: xoá sạch rồi chạy lại migration
      }),
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    LoyaltyModule,
  ],
  controllers: [HealthController],
  providers: [SeedService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLogger).forRoutes('*');
  }
}
