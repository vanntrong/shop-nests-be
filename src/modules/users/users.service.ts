import { User } from '@/entities/user/user.entity';
import { Filter, Query } from '@/types/common';
import { $toUserResponse } from '@/utils/mongo';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcryptjs from 'bcryptjs';
import { readFile } from 'fs';
import slugify from 'slugify';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './users.dto';
import { UserErrorMessage } from './users.errorMessage';
import { GetUserByIdOptions } from './users.interface';

@Injectable()
export class UserService {
  logger: Logger;
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    this.logger = new Logger(UserService.name);
  }

  async getAll(query: Query, filter: Filter) {
    try {
      const { offset = 0, limit = 10, sortBy, sortOrder } = query;
      const { keyword = '', ..._filter } = filter;
      const [users, count] = await this.userRepository
        .createQueryBuilder('user')
        .where({ ..._filter, isDeleted: false })
        .andWhere('user.first_name ILIKE :keyword', { keyword: `%${keyword}%` })
        .orWhere('user.last_name ILIKE :keyword', { keyword: `%${keyword}%` })
        .skip(offset)
        .take(limit)
        .orderBy(
          `user.${sortBy || 'createdAt'}`,
          sortOrder === 'asc' ? 'ASC' : 'DESC',
        )
        .getManyAndCount();

      this.logger.log(`Get all users :: ${JSON.stringify({ query, filter })}`);

      return {
        message: 'Successful',
        offset,
        limit,
        total: count,
        hasNext: count > offset + limit,
        data: users.map($toUserResponse),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async getById(id: string, options: GetUserByIdOptions = {}) {
    const { isBasicInfo = false } = options;
    try {
      const exist = await this.userRepository.findOne({
        where: { id, isDeleted: false },
        ...(isBasicInfo && {
          select: ['id', 'avatar'],
        }),
      });

      if (!exist) {
        throw new HttpException(
          UserErrorMessage.user_not_found,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Successful',
        data: $toUserResponse(exist),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * It updates a user by id
   * @param {string} id - string - The id of the user to be updated
   * @param {UpdateUserDto} payload - UpdateUserDto
   * @returns return {
   *     message: 'Successful',
   *     data: (user),
   *   };
   */
  async update(id: string, payload: UpdateUserDto) {
    try {
      const exist = await this.$checkExistUser(id);

      if (!exist) {
        throw new HttpException(
          UserErrorMessage.user_not_found,
          HttpStatus.NOT_FOUND,
        );
      }

      const { ...body } = payload;

      let user = await this.userRepository.findOne({
        where: { id, isDeleted: false },
      });

      user = await this.userRepository.save({ ...user, ...body });

      return {
        message: 'Successful',
        data: $toUserResponse(user),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * It checks if the user exists, if it does, it updates the user's isDeleted property to true
   * @param {string} id - string - The id of the user to be deleted.
   * @returns Nothing
   */
  async delete(id: string) {
    try {
      const exist = await this.$checkExistUser(id);

      if (!exist) {
        throw new HttpException(
          UserErrorMessage.user_not_found,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.userRepository.update(id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      return;
    } catch (error) {
      throw error;
    }
  }

  async $checkExistUser(id: string) {
    return !!(await this.userRepository.count({
      where: { id, isDeleted: false },
    }));
  }

  $generateSlug = (name: string) => {
    return slugify(name, {
      replacement: '-',
      lower: true,
      remove: /[*+~.()'"!:@]/g,
      trim: true,
    });
  };

  async seed() {
    new Promise((resolve, reject) => {
      readFile('src/seeds/data/users.json', 'utf8', async (err, data) => {
        if (err) {
          reject(err);
        }

        const { users = [] } = JSON.parse(data) || {};

        Promise.all(
          users.map(async (user) => {
            const newUser = this.userRepository.create({
              ...user,
              password: bcryptjs.hashSync(user.password, 10),
            });

            await this.userRepository.save(newUser);
            console.log(`User ${user.email} created`);
          }),
        )
          .then(() => {
            resolve(true);
          })
          .catch((error) => {
            reject(error);
          });
      });
    });
  }
}
