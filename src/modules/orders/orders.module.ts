import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AccessTokenStrategy } from '@/strategies';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@/entities/product/product.entity';
import { Order } from '@/entities/order/order.entity';
import { OrderProduct } from '@/entities/orderProduct/orderProduct.entity';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [AccessTokenStrategy, OrdersService],
  exports: [OrdersService],
  imports: [TypeOrmModule.forFeature([Product, Order, OrderProduct])],
})
export class OrdersModule {}
