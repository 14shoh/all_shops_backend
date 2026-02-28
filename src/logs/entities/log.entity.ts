import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('logs')
export class Log extends BaseEntity {
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'text' })
  details: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;
}
