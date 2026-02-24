import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 20, default: '#6366f1' })
  color: string;

  @Column({ type: 'int', nullable: true })
  parentId: number | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Category | null;
}
