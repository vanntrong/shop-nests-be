import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '@/guards/jwt.guard';
import { User } from '@/decorators';
import { UpdateCartDto } from './cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(@User('id') id: string) {
    return this.cartService.getCart(id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async updateCart(@User('id') id: string, @Body() body: UpdateCartDto) {
    return this.cartService.updateCart(id, body);
  }
}
