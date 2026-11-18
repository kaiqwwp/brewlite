import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar', unique: true }) email: string;
  @Column({ type: 'varchar', default: '' }) name: string;
  @Column({ type: 'varchar' }) passwordHash: string;
  @Column({ type: 'varchar', default: 'CUSTOMER' }) role: 'CUSTOMER' | 'STAFF';
  @Column({ type: 'int', default: 0 }) loyaltyPoints: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
