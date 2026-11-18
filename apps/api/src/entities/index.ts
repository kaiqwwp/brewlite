import { LoyaltyTransaction } from './loyalty-transaction.entity';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';
import { Payment } from './payment.entity';
import { Product } from './product.entity';
import { Promotion } from './promotion.entity';
import { User } from './user.entity';

export const ENTITIES = [User, Product, Order, OrderItem, Payment, Promotion, LoyaltyTransaction];
