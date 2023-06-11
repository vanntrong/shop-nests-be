import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { AccessTokenStrategy } from '@/strategies';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '@/entities/cart/cart.entity';
import { CartProduct } from '@/entities/cartProduct/cartProduct.entity';
import { Product } from '@/entities/product/product.entity';
import { User } from '@/entities/user/user.entity';

@Module({
  controllers: [CartController],
  providers: [CartService, AccessTokenStrategy],
  exports: [CartService],
  imports: [TypeOrmModule.forFeature([Cart, User, CartProduct, Product])],
})
export class CartModule {}
