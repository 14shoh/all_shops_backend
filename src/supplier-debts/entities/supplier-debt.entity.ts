import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Shop } from '../../shops/entities/shop.entity';

@Entity('supplier_debts')
export class SupplierDebt extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  supplierName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalDebt: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingAmount: number;

  @Column()
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
