import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int' }) orderId: number;
  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;
  @Column({ type: 'int' }) userId: number;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user?: User;
  /** Idempotency-Key: duy nhất toàn hệ thống, đảm bảo 1 yêu cầu thanh toán chỉ xử lý 1 lần */
  @Column({ type: 'varchar', unique: true }) idempotencyKey: string;
  @Column({ type: 'int' }) amount: number;
  @Column({ type: 'varchar' }) method: 'WALLET' | 'CARD';
  @Column({ type: 'varchar' }) status: 'SUCCESS' | 'FAILED';
  @Column({ type: 'varchar', nullable: true }) reference: string | null;
  @Column({ type: 'varchar', nullable: true }) failureReason: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
