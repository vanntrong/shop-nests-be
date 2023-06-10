import { User } from '@/entities/user/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivateUserController, UserController } from './users.controller';
import { UserService } from './users.service';
import { AccessTokenStrategy } from '@/strategies';
import { RefreshTokenStrategy } from '@/strategies/refreshToken.strategy';

@Module({
  providers: [UserService, AccessTokenStrategy, RefreshTokenStrategy],
  exports: [UserService],
  controllers: [UserController, PrivateUserController],
  imports: [TypeOrmModule.forFeature([User])],
})
export class UserModule {}
