import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Shop } from '../../shops/entities/shop.entity';

@Entity('shop_settings')
export class ShopSettings extends BaseEntity {
  @Column()
  shopId: number;

  @ManyToOne(() => Shop, (shop) => shop.settings)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @Column({ default: true })
  enableSizes: boolean; // Для одежды

  @Column({ default: true })
  enableWeight: boolean; // Для продуктов

  @Column({ default: true })
  enableBarcode: boolean;

  @Column({ default: true })
  enableCategories: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentAccountNumber: string | null; // Номер счета/телефона для QR оплаты

  @Column({ type: 'json', nullable: true })
  customSettings: Record<string, any>;
}
