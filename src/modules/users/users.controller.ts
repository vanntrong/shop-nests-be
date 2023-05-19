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
import { Query } from '@nestjs/common/decorators';
import { CreateAddressDto, UpdateUserDto } from './users.dto';
import { UserErrorMessage } from './users.errorMessage';
import { UserService } from './users.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  $checkAuthorized(userId: string, id: string, userRoles: string[] = []) {
    if (userId !== id && !userRoles.includes('admin')) {
      throw new HttpException(UserErrorMessage.forbidden, HttpStatus.FORBIDDEN);
    }
  }

  @Get()
  getAll(@Query() _query: PaginationDto) {
    const { query, filter } = generateQuery(_query);
    return this.userService.getAll(query, filter);
  }

  @Get('me')
  getMe(@Headers('x-user-id') userId: string) {
    return this.userService.getById(userId);
  }

  @Put(':id')
  update(
    @Body() body: UpdateUserDto,
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-roles') userRoles: string[],
  ) {
    this.$checkAuthorized(userId, id, userRoles);
    return this.userService.update(id, body);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.userService.getById(id, { isBasicInfo: true });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-roles') userRoles: string[],
  ) {
    this.$checkAuthorized(userId, id, userRoles);
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
