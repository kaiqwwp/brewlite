import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards';
import { AuthUser, CurrentUser } from '../common/current-user';
import { User } from '../entities/user.entity';
import { LoyaltyService } from '../promotions/promotions.service';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(@InjectDataSource() private readonly ds: DataSource, private readonly loyalty: LoyaltyService) {}

  /** Số dư điểm và lịch sử cộng/thu hồi điểm của người đang đăng nhập. */
  @Get('me')
  async me(@CurrentUser() cu: AuthUser) {
    const user = await this.ds.manager.findOneByOrFail(User, { id: cu.id });
    const transactions = await this.loyalty.history(this.ds.manager, cu.id);
    return { balance: user.loyaltyPoints, transactions };
  }
}
