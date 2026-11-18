import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ChargeRequest { amount: number; method: 'WALLET' | 'CARD'; simulateFailure?: boolean }
export interface ChargeResult { ok: boolean; reference: string | null; reason?: string }

/** Cổng thanh toán giả lập (mô phỏng Momo/VNPay/Stripe). */
@Injectable()
export class MockPaymentGateway {
  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (req.simulateFailure) return { ok: false, reference: null, reason: 'Thanh toán bị từ chối (mô phỏng)' };
    if (req.amount <= 0) return { ok: false, reference: null, reason: 'Số tiền không hợp lệ' };
    return { ok: true, reference: `MOCK-${req.method}-${randomUUID().slice(0, 8).toUpperCase()}` };
  }
}
