import { Category } from '@/entities/category/category.entity';
import { AccessTokenStrategy } from '@/strategies';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { User } from '@/entities/user/user.entity';

@Module({
  controllers: [CategoriesController],
  providers: [AccessTokenStrategy, CategoriesService],
  exports: [CategoriesService],
  imports: [TypeOrmModule.forFeature([Category, User])],
})
export class CategoriesModule {}
