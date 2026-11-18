import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Promotion } from './promotion.entity';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from '../orders/order-status';

@Entity('orders')
@Index(['userId', 'idempotencyKey'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int' }) userId: number;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user?: User;
  @Column({ type: 'varchar', default: OrderStatus.PENDING }) status: OrderStatus;
  @Column({ type: 'int' }) subtotal: number;
  @Column({ type: 'int', default: 0 }) discount: number;
  @Column({ type: 'int' }) total: number;
  @Column({ type: 'varchar', nullable: true }) couponCode: string | null;
  @ManyToOne(() => Promotion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'couponCode' })
  promotion?: Promotion | null;
  @Column({ type: 'varchar', nullable: true }) idempotencyKey: string | null;
  @Column({ type: 'boolean', default: false }) pointsAwarded: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @OneToMany(() => OrderItem, (i) => i.order, { cascade: ['insert'] }) items: OrderItem[];
}
