import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user/user.entity';
import { Promotion } from '@/entities/promotion/promotion.entity';

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
  imports: [TypeOrmModule.forFeature([User, Promotion])],
})
export class PromotionsModule {}
