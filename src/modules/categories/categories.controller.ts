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
import { CategoriesService } from './categories.service';
import { PaginationDto } from '@/validations/common';
import { generateQuery } from '@/utils/helper';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { JwtAuthGuard } from '@/guards/jwt.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getAll(@Query() _query: PaginationDto) {
    const { query, filter } = generateQuery(_query);
    return this.categoriesService.getAll(query, filter);
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.categoriesService.getOne(slug);
  }

  @Get('private/parent')
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  getParentCategories() {
    return this.categoriesService.getParentCategories();
  }

  @Get('private/:id')
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  getOneById(@Param('id') slug: string) {
    return this.categoriesService.getOneById(slug);
  }

  @Post()
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  create(@Body() body: CreateCategoryDto) {
    return this.categoriesService.create(body);
  }

  @Put(':id')
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  update(@Body() body: UpdateCategoryDto, @Param('id') id: string) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
