import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { PromotionsService } from '../promotions/promotions.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StockService } from './stock.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  controllers: [OrdersController],
  providers: [OrdersService, StockService, PromotionsService],
  exports: [OrdersService],
})
export class OrdersModule {}
