import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Order } from '../order/order.entity';

export const TYPE_PROMOTIONS = ['percent', 'money'];
export const DISCOUNT_FOR = ['product', 'shipping'];

@Entity()
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  @Index({
    unique: true,
  })
  id: string;

  @Column({
    name: 'is_active',
    default: true,
    type: 'boolean',
  })
  isActive: boolean;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    unique: true,
  })
  @Index({
    unique: true,
  })
  code: string;

  @Column({
    type: 'enum',
    name: 'type_promotion',
    enum: TYPE_PROMOTIONS,
  })
  typePromotion: string;

  @Column({
    type: 'enum',
    name: 'discount_for',
    enum: DISCOUNT_FOR,
  })
  discountFor: string;

  @Column({
    type: 'float',
  })
  value: number;

  @Column({
    type: 'float',
    name: 'max_value',
    nullable: true,
  })
  maxValue: number;

  @Column({
    name: 'used_times',
    nullable: true,
    default: 0,
  })
  usedTimes: number;

  @Column({
    name: 'max_used_times',
    nullable: true,
  })
  maxUsedTimes: number;

  @ManyToOne(() => User, (user) => user.promotionsCreated)
  @JoinColumn({
    name: 'created_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_promotion_created_by',
  })
  createdBy: User;

  @OneToMany(() => Order, (order) => order.promotionUsed)
  ordersUsed: Order[];

  @Column({
    default: false,
    name: 'is_deleted',
  })
  isDeleted: boolean;

  @Column({
    name: 'expired_at',
    type: 'timestamp',
    nullable: true,
  })
  expiredAt: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    nullable: true,
  })
  updatedAt: Date;

  @Column({
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt: Date;
}
