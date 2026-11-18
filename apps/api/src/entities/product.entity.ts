import { Check, Column, Entity, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

@Entity('products')
@Check('CHK_products_stock_non_negative', '"stock" >= 0')
export class Product {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar' }) name: string;
  @Column({ type: 'varchar', default: '' }) description: string;
  /** Giá gốc (size M), đơn vị VND */
  @Column({ type: 'int' }) price: number;
  @Column({ type: 'varchar', default: '' }) imageUrl: string;
  @Column({ type: 'int', default: 0 }) stock: number;
  /** Optimistic locking: tăng 1 mỗi lần cập nhật */
  @VersionColumn() version: number;
}
