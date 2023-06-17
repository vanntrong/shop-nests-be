import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateShipmentDto } from './orders.dto';
import { PaginationDto } from '@/validations/common';
import { generateQuery } from '@/utils/helper';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }

  @Get()
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async findAll(@Query() _query: PaginationDto) {
    const { query, filter } = generateQuery(_query);
    return this.ordersService.findAll(query, filter);
  }

  @HttpCode(HttpStatus.OK)
  @Post('updateShipment')
  async updateShipment(@Body() body: UpdateShipmentDto) {
    return this.ordersService.updateShipment(body);
  }
}
