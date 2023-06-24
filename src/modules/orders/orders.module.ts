import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AccessTokenStrategy } from '@/strategies';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@/entities/product/product.entity';
import { Order } from '@/entities/order/order.entity';
import { OrderProduct } from '@/entities/orderProduct/orderProduct.entity';
import { OrdersService } from './orders.service';
import { ShipModule } from '../ship/ship.module';
import { User } from '@/entities/user/user.entity';
import { Promotion } from '@/entities/promotion/promotion.entity';
import { PromotionsModule } from '../promotions/promotions.module';
import { Cart } from '@/entities/cart/cart.entity';
import { CartProduct } from '@/entities/cartProduct/cartProduct.entity';

@Module({
  controllers: [OrdersController],
  providers: [AccessTokenStrategy, OrdersService],
  exports: [OrdersService],
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Order,
      OrderProduct,
      User,
      Promotion,
      Cart,
      CartProduct,
    ]),
    ShipModule,
    PromotionsModule,
  ],
})
export class OrdersModule {}
