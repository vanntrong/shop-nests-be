import { Module } from '@nestjs/common';
import { ShipController } from './ship.controller';
import { ShipService } from './ship.service';

@Module({
  controllers: [ShipController],
  exports: [ShipService],
  providers: [ShipService],
})
export class ShipModule {}
