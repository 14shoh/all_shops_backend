import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { SaleItem } from '../../sales/entities/sale-item.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  barcode: string; // Убрали unique для поддержки нескольких размеров с одним штрихкодом

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  purchasePrice: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ nullable: true })
  size: string; // Для одежды: S, M, L, XL и т.д.

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number; // Для продуктов: вес в кг

  @Column()
  shopId: number;

  @ManyToOne(() => Shop, (shop) => shop.products)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.product)
  saleItems: SaleItem[];
}
