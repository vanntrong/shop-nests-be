import { Controller, Get, Query } from '@nestjs/common';
import { GetFeeShipDto } from './ship.dto';
import { ShipService } from './ship.service';

@Controller('ship')
export class ShipController {
  constructor(private readonly shipService: ShipService) {}

  @Get('fee')
  getFee(@Query() param: GetFeeShipDto) {
    return this.shipService.getFee(param);
  }
}
