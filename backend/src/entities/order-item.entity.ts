import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'int' }) orderId: number;
  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;
  @Column({ type: 'int' }) productId: number;
  @Column({ type: 'varchar' }) productName: string;
  @Column({ type: 'varchar' }) size: string;
  @Column({ type: 'simple-array', nullable: true }) toppings: string[] | null;
  @Column({ type: 'int' }) qty: number;
  @Column({ type: 'int' }) unitPrice: number;
  @Column({ type: 'int' }) lineTotal: number;
}
