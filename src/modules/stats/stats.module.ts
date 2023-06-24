import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { AccessTokenStrategy } from '@/strategies';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@/entities/product/product.entity';
import { Order } from '@/entities/order/order.entity';
import { User } from '@/entities/user/user.entity';

@Module({
  controllers: [StatsController],
  providers: [StatsService, AccessTokenStrategy],
  exports: [StatsService],
  imports: [TypeOrmModule.forFeature([User, Product, Order])],
})
export class StatsModule {}
