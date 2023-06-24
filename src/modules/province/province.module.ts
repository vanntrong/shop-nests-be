import { Module } from '@nestjs/common';
import { ProvinceController } from './province.controller';
import { ProvinceService } from './province.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from '@/entities/province/province.entity';
import { District } from '@/entities/district/district.entity';
import { Ward } from '@/entities/ward/ward.entity';

@Module({
  controllers: [ProvinceController],
  exports: [ProvinceService],
  providers: [ProvinceService],
  imports: [TypeOrmModule.forFeature([Province, District, Ward])],
})
export class ProvinceModule {}
