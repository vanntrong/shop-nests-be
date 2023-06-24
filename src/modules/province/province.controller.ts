import { Controller, Get, Param } from '@nestjs/common';
import { ProvinceService } from './province.service';

@Controller('province')
export class ProvinceController {
  constructor(private readonly provinceService: ProvinceService) {}

  @Get()
  async findAll() {
    return this.provinceService.findAll();
  }

  @Get('seed')
  async seed() {
    return this.provinceService.seed();
  }

  @Get(':code/districts')
  async findDistrictsByProvinceCode(@Param('code') code: number) {
    return this.provinceService.findDistrictsByProvinceCode(code);
  }

  @Get(':code/districts/:districtCode/wards')
  async findWardsByDistrictCode(@Param('districtCode') districtCode: number) {
    return this.provinceService.findWardsByDistrictCode(districtCode);
  }
}
