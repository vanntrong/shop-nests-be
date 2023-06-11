import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from '../order/order.entity';
import { Product } from '../product/product.entity';

@Entity()
export class OrderProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    name: 'order_id',
  })
  orderId: string;

  @Column({
    type: 'uuid',
    name: 'product_id',
  })
  productId: string;

  @Column({
    type: 'int',
    name: 'quantity',
  })
  quantity: number;

  @Column({
    type: 'float',
    name: 'price',
  })
  price: number;

  @ManyToOne(() => Order, (order) => order.orderProducts)
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderProducts)
  product: Product;
}
