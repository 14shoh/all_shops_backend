import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { ShopSettings } from '../../shop-settings/entities/shop-settings.entity';

export enum ShopType {
  CLOTHING = 'clothing',
  GROCERY = 'grocery',
  GENERAL = 'general',
}

@Entity('shops')
export class Shop extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ShopType,
    default: ShopType.GENERAL,
  })
  type: ShopType;

  @Column({ nullable: true })
  address: string;

  // ВАЖНО: для union-типа обязательно задаём `type`, иначе reflect-metadata даст "Object"
  // и TypeORM (MySQL) упадёт с DataTypeNotSupportedError.
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ nullable: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.shop)
  users: User[];

  @OneToMany(() => Product, (product) => product.shop)
  products: Product[];

  @OneToMany(() => ShopSettings, (settings) => settings.shop)
  settings: ShopSettings;
}
