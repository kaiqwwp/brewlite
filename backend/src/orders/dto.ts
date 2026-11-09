import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { SIZE_CODES, SizeCode } from '../common/catalog';
import { OrderStatus } from './order-status';

export class OrderItemDto {
  @IsInt() @Min(1)
  productId: number;

  @IsIn(SIZE_CODES, { message: 'Size phải là S, M hoặc L' })
  size: SizeCode;

  @IsOptional() @IsArray() @IsString({ each: true })
  toppings?: string[];

  @IsInt({ message: 'Số lượng phải là số nguyên' }) @Min(1) @Max(20)
  qty: number;
}

export class CreateOrderDto {
  @IsArray() @ArrayMinSize(1, { message: 'Giỏ hàng trống' }) @ArrayMaxSize(50)
  @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional() @IsString() @MaxLength(40)
  couponCode?: string;
}

export class UpdateStatusDto {
  @IsIn(Object.values(OrderStatus))
  status: OrderStatus;
}
