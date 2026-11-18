import { Module } from '@nestjs/common';
import { LoyaltyService } from '../promotions/promotions.service';
import { LoyaltyController } from './loyalty.controller';

@Module({ controllers: [LoyaltyController], providers: [LoyaltyService] })
export class LoyaltyModule {}
