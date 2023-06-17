import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  async findAll(@Query() _query: PaginationDto) {
    const { query, filter } = generateQuery(_query);
    return this.productService.findAll(query, filter);
  }

  @Get(':slug')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async findOne(@Param('slug') slug: string) {
    return this.productService.findOne(slug);
  }

  @Post()
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async create(@Body() body: CreateProductDto) {
    return this.productService.create(body);
  }

  @Put(':id')
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Get('private/:id')
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  async getById(@Param('id') id: string) {
    return this.productService.getById(id);
  }
}
