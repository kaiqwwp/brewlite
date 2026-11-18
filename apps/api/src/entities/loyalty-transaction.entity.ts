import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

export enum LoyaltyType {
  EARN = 'EARN',
  REVOKE = 'REVOKE',
}

/**
 * Sổ điểm thưởng: mỗi lần cộng (EARN, khi đơn PAID) hoặc thu hồi (REVOKE, khi hủy đơn đã PAID)
 * ghi một dòng. UNIQUE(orderId, type) bảo đảm mỗi đơn chỉ cộng một lần và thu hồi một lần.
 * users.loyaltyPoints là số dư, bằng tổng EARN trừ tổng REVOKE.
 */
@Entity('loyalty_transactions')
@Index(['orderId', 'type'], { unique: true })
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int' }) userId: number;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user?: User;
  @Column({ type: 'int' }) orderId: number;
  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;
  @Column({ type: 'varchar' }) type: LoyaltyType;
  /** Số điểm, luôn dương; dấu do `type` quyết định */
  @Column({ type: 'int' }) points: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
