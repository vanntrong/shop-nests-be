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
import { Category } from '../category/category.entity';
import { OrderProduct } from '../orderProduct/orderProduct.entity';
import { CartProduct } from '../cartProduct/cartProduct.entity';
import { User } from '../user/user.entity';

@Entity()
export class Product {
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

  @Column({
    unique: true,
    name: 'name',
  })
  name: string;

  @Index({
    fulltext: true,
  })
  @Column({
    unique: true,
    name: 'slug',
  })
  slug: string;

  @Column({
    name: 'thumbnail_url',
  })
  thumbnailUrl: string;

  @Column({
    name: 'price',
    type: 'float',
  })
  price: number;

  @Column({
    name: 'description',
  })
  description: string;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.product)
  orderProducts: OrderProduct[];

  @OneToMany(() => CartProduct, (cartProduct) => cartProduct.product)
  cartProducts: CartProduct[];

  @ManyToOne(() => User, (user) => user.productsCreated)
  @JoinColumn({
    name: 'created_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_product_created_by',
  })
  createdBy: User;

  @Column({
    name: 'sale_price',
    nullable: true,
  })
  salePrice: number;

  @Column({
    array: true,
    type: 'text',
  })
  images: string[];

  @Column({
    name: 'weight',
    type: 'float',
    default: 0,
  })
  weight: number;

  @Column({
    name: 'inventory',
    default: 0,
  })
  inventory: number;

  @Column({
    type: 'timestamp',
    name: 'sale_end_at',
    nullable: true,
  })
  saleEndAt: Date;

  @Column({
    name: 'detail_description',
  })
  detailDescription: string;

  @Column({
    default: false,
    name: 'is_deleted',
  })
  isDeleted: boolean;

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
