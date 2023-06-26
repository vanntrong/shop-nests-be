import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateShipmentDto } from './orders.dto';
import { PaginationDto } from '@/validations/common';
import { generateQuery } from '@/utils/helper';
import { JwtAuthGuard } from '@/guards/jwt.guard';
import { User } from '@/decorators';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(new JwtAuthGuard({ allowUnauthorizedRoute: true }))
  create(@Body() body: CreateOrderDto, @User() user: any) {
    const isUnknownUser = !user;
    const userId = isUnknownUser ? undefined : user.id;
    return this.ordersService.create(body, userId);
  }

  @Get()
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async findAll(@Query() _query: PaginationDto) {
    const { query, filter } = generateQuery(_query);
    return this.ordersService.findAll(query, filter);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async findMyOrders(
    @Query() _query: PaginationDto,
    @User('id') userId: string,
  ) {
    const { query, filter } = generateQuery(_query);
    return this.ordersService.findMyOrders(query, filter, userId);
  }

  @Get('count-point')
  async countPoint(@Query('total') total: number) {
    return this.ordersService.countPoint(total);
  }

  @HttpCode(HttpStatus.OK)
  @Post('updateShipment')
  async updateShipment(@Body() body: UpdateShipmentDto) {
    return this.ordersService.updateShipment(body);
  }
}
