import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Inventory } from './inventory.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @Column()
  inventoryId: number;

  @ManyToOne(() => Inventory, (inventory) => inventory.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventoryId' })
  inventory: Inventory;

  @Column()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int' })
  expectedQuantity: number;

  @Column({ type: 'int' })
  actualQuantity: number;

  @Column({ type: 'int' })
  difference: number;
}
