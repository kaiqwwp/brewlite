import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Chương trình khuyến mãi theo mã (BREW10, WELCOME20...). Bảng `promotions`. */
@Entity('promotions')
export class Promotion {
  @PrimaryColumn({ type: 'varchar' }) code: string;
  @Column({ type: 'int' }) percentOff: number;
  @Column({ type: 'int', default: 0 }) minTotal: number;
  @Column({ type: 'int', nullable: true }) maxDiscount: number | null;
  @Column({ type: 'boolean', default: true }) active: boolean;
  @Column({ type: 'timestamptz', nullable: true }) expiresAt: Date | null;
}
