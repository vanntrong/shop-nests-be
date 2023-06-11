import { User } from '@/entities/user/user.entity';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Cart } from '@/entities/cart/cart.entity';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
  imports: [TypeOrmModule.forFeature([User, Cart]), JwtModule.register({})],
})
export class AuthModule {}
