import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { Cart } from '../cart/cart.entity';

@Entity()
export class CartProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.cartProducts)
  product: Product;

  @ManyToOne(() => Cart, (cart) => cart.cartProducts)
  cart: Cart;

  @Column({
    type: 'int',
    name: 'quantity',
  })
  quantity: number;

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
