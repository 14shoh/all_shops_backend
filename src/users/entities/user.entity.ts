import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Expense } from '../../expenses/entities/expense.entity';

export enum UserRole {
  SELLER = 'seller',
  SHOP_OWNER = 'shop_owner',
  ADMIN = 'admin_of_app',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  shopId: number;

  @ManyToOne(() => Shop, (shop) => shop.users, { nullable: true })
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @OneToMany(() => Sale, (sale) => sale.seller)
  sales: Sale[];

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];
}
