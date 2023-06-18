import { User } from '@/entities/user/user.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserErrorMessage } from '../users/users.errorMessage';

@Injectable()
export class CommonService {
  logger: Logger;
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    this.logger = new Logger(CommonService.name);
  }

  async $isAdminQuery(userId?: string) {
    try {
      if (!userId) return false;

      const userRoles = await this.userRepository.findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
      });

      if (!userRoles) {
        throw new HttpException(
          UserErrorMessage['user_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      return userRoles.roles.includes('admin');
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
