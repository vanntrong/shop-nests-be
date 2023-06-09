import { generateQuery } from '@/utils/helper';
import { PaginationDto } from '@/validations/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Patch, Query, UseGuards } from '@nestjs/common/decorators';
import { CreateUserDto, UpdateUserDto } from './users.dto';
import { UserErrorMessage } from './users.errorMessage';
import { UserService } from './users.service';
import { JwtAuthGuard } from '@/guards/jwt.guard';
import { User } from '@/decorators';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  $checkAuthorized(userId: string, id: string, userRoles: string[] = []) {
    if (userId !== id && !userRoles.includes('admin')) {
      throw new HttpException(UserErrorMessage.forbidden, HttpStatus.FORBIDDEN);
    }
  }

  @Get()
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  getAll(@Query() _query: PaginationDto) {
    const { query, filter } = generateQuery(_query);
    return this.userService.getAll(query, filter);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@User('id') id: string) {
    return this.userService.getById(id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@User('id') id: string, @Body() body: UpdateUserDto) {
    return this.userService.update(id, body);
  }

  @Put(':id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  update(@Body() body: UpdateUserDto, @Param('id') id: string) {
    return this.userService.update(id, body);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  restore(@Param('id') id: string) {
    return this.userService.restore(id);
  }

  @Get(':id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  getById(@Param('id') id: string) {
    return this.userService.getById(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @UseGuards(new JwtAuthGuard({ isPrivateRoute: true }))
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Post('seed')
  seed() {
    return this.userService.seed();
  }
}

@Controller('private/users')
export class PrivateUserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Headers('x-user-roles') userRoles: string[],
  ) {
    if (!userRoles || !userRoles.includes('admin')) {
      throw new HttpException(UserErrorMessage.forbidden, HttpStatus.FORBIDDEN);
    }
    return this.userService.getById(id);
  }
}
