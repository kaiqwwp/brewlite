import { BadRequestException, Body, Controller, Headers, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards';
import { AuthUser, CurrentUser } from '../common/current-user';
import { PayDto } from './dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * Task 8: thanh toán không tiền mặt (mock). Bắt buộc header Idempotency-Key.
   * 201 = thanh toán mới thành công · 200 = gửi lặp (replayed) · 402 = thanh toán lỗi (đơn → PAYMENT_FAILED).
   */
  @Post()
  async pay(
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') key: string | undefined,
    @Body() dto: PayDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const k = key?.trim();
    if (!k || k.length > 128) throw new BadRequestException('Thiếu header Idempotency-Key (tối đa 128 ký tự)');
    const { replayed, payment } = await this.payments.pay(user.id, k, dto);
    const success = payment.status === 'SUCCESS';
    res.status(!success ? HttpStatus.PAYMENT_REQUIRED : replayed ? HttpStatus.OK : HttpStatus.CREATED);
    if (replayed) res.setHeader('Idempotent-Replayed', 'true');
    return {
      success,
      replayed,
      message: success ? 'Thanh toán thành công' : payment.failureReason ?? 'Thanh toán thất bại',
      payment: {
        id: payment.id, status: payment.status, method: payment.method, amount: payment.amount,
        reference: payment.reference, failureReason: payment.failureReason,
      },
      order: await this.payments.view(payment.orderId),
    };
  }
}
