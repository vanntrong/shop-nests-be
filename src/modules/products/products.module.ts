import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AccessTokenStrategy } from '@/strategies';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '@/entities/category/category.entity';
import { Product } from '@/entities/product/product.entity';
import { User } from '@/entities/user/user.entity';

@Module({
  providers: [ProductsService, AccessTokenStrategy],
  controllers: [ProductsController],
  exports: [ProductsService],
  imports: [TypeOrmModule.forFeature([Product, Category, User])],
})
export class ProductsModule {}
