import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartProduct } from '../cartProduct/cartProduct.entity';
import { User } from '../user/user.entity';

@Entity()
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  @Index({
    unique: true,
  })
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany(() => CartProduct, (cartProduct) => cartProduct.cart)
  cartProducts: CartProduct[];

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
