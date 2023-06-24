import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
