import { Category } from '@/entities/category/category.entity';
import { Product } from '@/entities/product/product.entity';
import { User } from '@/entities/user/user.entity';
import { AccessTokenStrategy } from '@/strategies';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Order } from '@/entities/order/order.entity';

@Module({
  providers: [ProductsService, AccessTokenStrategy],
  controllers: [ProductsController],
  exports: [ProductsService],
  imports: [TypeOrmModule.forFeature([Product, Category, User, Order])],
})
export class ProductsModule {}
