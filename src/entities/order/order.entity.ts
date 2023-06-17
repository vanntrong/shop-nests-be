import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderProduct } from '../orderProduct/orderProduct.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  @Index({
    unique: true,
  })
  id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column()
  province: string;

  @Column()
  district: string;

  @Column()
  ward: string;

  @Column()
  address: string;

  @Column({
    type: 'float',
    name: 'fee_ship',
  })
  feeShip: number;

  @Column({
    type: 'float',
    name: 'value',
  })
  value: number;

  @Column({
    nullable: true,
  })
  note: string;

  @Column({
    name: 'status_id',
    nullable: true,
    default: 1,
  })
  statusId: number;

  @Column({
    name: 'reason_code',
    nullable: true,
  })
  reasonCode: string;

  @Column({
    nullable: true,
  })
  reason: string;

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order)
  orderProducts: OrderProduct[];

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    nullable: true,
  })
  updatedAt: Date;
}
