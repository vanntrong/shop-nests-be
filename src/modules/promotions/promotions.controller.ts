import { User } from '@/decorators';
import { JwtAuthGuard } from '@/guards/jwt.guard';
import { generateQuery } from '@/utils/helper';
import { PaginationDto } from '@/validations/common';
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
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreatePromotionDto, UpdateStatusPromotion } from './promotions.dto';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  create(@Body() body: CreatePromotionDto, @User('id') userId: string) {
    return this.promotionsService.create(body, userId);
  }

  @Get()
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  findAll(@Query() _query: PaginationDto) {
    const { query, filter } = generateQuery(_query);
    return this.promotionsService.findAll(query, filter);
  }

  @Get(':id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  getOne(@Param('id') id: string) {
    return this.promotionsService.getOne(id);
  }

  @Get(':code/value')
  getValue(@Param('code') code: string) {
    return this.promotionsService.getValue(code);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  delete(@Param('id') id: string) {
    return this.promotionsService.delete(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  update(@Param('id') id: string, @Body() body: UpdateStatusPromotion) {
    return this.promotionsService.updateStatus(id, body);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  restore(@Param('id') id: string) {
    return this.promotionsService.restore(id);
  }
}
