import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { PaginationDto } from '@/validations/common';
import { generateQuery } from '@/utils/helper';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { JwtAuthGuard } from '@/guards/jwt.guard';
import { User } from '@/decorators';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  @UseGuards(new JwtAuthGuard({ allowUnauthorizedRoute: true }))
  async findAll(@Query() _query: PaginationDto, @User() user: any) {
    const { query, filter } = generateQuery(_query);
    const userId = user === false ? undefined : user.id;
    return this.productService.findAll(query, filter, userId);
  }

  @Get('seed')
  async seed() {
    return this.productService.seed();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.productService.findOne(slug);
  }

  @Post()
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async create(@Body() body: CreateProductDto, @User('id') userId: string) {
    return this.productService.create(body, userId);
  }

  @Put(':id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  restore(@Param('id') id: string) {
    return this.productService.restore(id);
  }

  @Get('private/:id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async getById(@Param('id') id: string) {
    return this.productService.getById(id);
  }
}
