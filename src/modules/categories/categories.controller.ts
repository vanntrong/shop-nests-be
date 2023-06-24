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
import { CategoriesService } from './categories.service';
import { PaginationDto } from '@/validations/common';
import { generateQuery } from '@/utils/helper';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { JwtAuthGuard } from '@/guards/jwt.guard';
import { User } from '@/decorators';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @UseGuards(new JwtAuthGuard({ allowUnauthorizedRoute: true }))
  getAll(@Query() _query: PaginationDto, @User() user: any) {
    const { query, filter } = generateQuery(_query);
    const userId = user === false ? undefined : user.id;
    return this.categoriesService.getAll(query, filter, userId);
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.categoriesService.getOne(slug);
  }

  @Get('private/seed')
  seed() {
    return this.categoriesService.seed();
  }

  @Get('private/parent')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  getParentCategories(@User('id') userId: string) {
    return this.categoriesService.getParentCategories(userId);
  }

  @Get('private/:id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  getOneById(@Param('id') slug: string) {
    return this.categoriesService.getOneById(slug);
  }

  @Post()
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  create(@Body() body: CreateCategoryDto, @User('id') userId: string) {
    return this.categoriesService.create(body, userId);
  }

  @Put(':id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  update(@Body() body: UpdateCategoryDto, @Param('id') id: string) {
    return this.categoriesService.update(id, body);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  restore(@Param('id') id: string) {
    return this.categoriesService.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
