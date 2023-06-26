import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderProduct } from '../orderProduct/orderProduct.entity';
import { Promotion } from '../promotion/promotion.entity';

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
    type: 'float',
    name: 'actual_value',
  })
  actualValue: number;

  @Column({
    type: 'float',
    name: 'point_earned',
    nullable: true,
  })
  pointEarned: number;

  @Column({
    type: 'float',
    name: 'point_used',
    nullable: true,
  })
  pointUsed: number;

  @ManyToOne(() => Promotion, (promotion) => promotion.ordersUsed)
  @JoinColumn({
    name: 'promotion_used',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_order_promotion_used',
  })
  promotionUsed: Promotion;

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

  @Column({
    name: 'user_id',
    nullable: true,
  })
  userId: string;

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
