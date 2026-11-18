import {
  Body, Controller, Get, Headers, HttpStatus, Param, ParseIntPipe, Patch, Post, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { AuthUser, CurrentUser } from '../common/current-user';
import { CreateOrderDto, UpdateStatusDto } from './dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Task 6: tạo đơn PENDING. Header Idempotency-Key (tuỳ chọn) chống tạo đơn trùng. */
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') key: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { replayed, order } = await this.orders.create(user.id, dto, key?.trim().slice(0, 128) || undefined);
    if (replayed) {
      res.status(HttpStatus.OK);
      res.setHeader('Idempotent-Replayed', 'true');
    }
    return order;
  }

  // Phải khai báo trước ":id"
  @Get('me')
  history(@CurrentUser() user: AuthUser) {
    return this.orders.history(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.findOne(id, user);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.cancel(id, user);
  }

  /** Phần mở rộng ngoài MVP: barista cập nhật PREPARING → READY → COMPLETED. */
  @Patch(':id/status')
  @Roles('STAFF')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.orders.staffUpdate(id, dto.status);
  }
}
