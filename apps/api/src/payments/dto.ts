import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class PayDto {
  @IsInt() @Min(1)
  orderId: number;

  @IsIn(['WALLET', 'CARD'], { message: 'Phương thức phải là WALLET hoặc CARD' })
  method: 'WALLET' | 'CARD';

  /** Chỉ cho cổng thanh toán GIẢ LẬP: ép lỗi để demo/kiểm thử luồng PAYMENT_FAILED. */
  @IsOptional() @IsBoolean()
  simulateFailure?: boolean;
}
