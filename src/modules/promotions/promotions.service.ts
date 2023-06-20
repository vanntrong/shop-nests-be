import { Promotion } from '@/entities/promotion/promotion.entity';
import { User } from '@/entities/user/user.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreatePromotionDto, UpdateStatusPromotion } from './promotions.dto';
import { UserErrorMessage } from '../users/users.errorMessage';
import { Filter, PaginationResult, Query, Result } from '@/types/common';
import { omit } from 'lodash';
import { PromotionErrorMessage } from './promotions.errorMessage';

@Injectable()
export class PromotionsService {
  logger: Logger;

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    this.logger = new Logger(PromotionsService.name);
  }

  async create(
    body: CreatePromotionDto,
    userId: string,
  ): Promise<Result<Partial<Promotion>>> {
    try {
      const author = await this.userRepository.findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
      });

      if (!author) {
        throw new HttpException(
          UserErrorMessage['user_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      const code = body.code ? body.code : this.$generateCode(body.discountFor);

      const promotion = await this.promotionRepository.save({
        ...body,
        code,
        createdBy: author,
      });

      return {
        message: 'Create promotion successfully',
        data: {
          ...omit(promotion, 'createdBy'),
        },
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async findAll(
    query: Query,
    filter: Filter,
  ): Promise<PaginationResult<Promotion>> {
    try {
      const { offset = 0, limit = 10, sortBy, sortOrder } = query;
      const { keyword = '', ..._filter } = filter;

      const [promotions, count] = await this.promotionRepository
        .createQueryBuilder('promotion')
        .leftJoinAndSelect('promotion.createdBy', 'createdBy')

        .where(
          new Brackets((subQb) => {
            subQb
              .where('promotion.code ILIKE :keyword', {
                keyword: `%${keyword}%`,
              })
              .orWhere('promotion.name ILIKE :keyword', {
                keyword: `%${keyword}%`,
              });
          }),
        )
        .andWhere({
          ..._filter,
        })
        .select([
          'promotion',
          'createdBy.id',
          'createdBy.name',
          'createdBy.roles',
        ])
        .skip(offset)
        .take(limit)
        .orderBy(
          `promotion.${sortBy || 'createdAt'}`,
          sortOrder === 'asc' ? 'ASC' : 'DESC',
        )
        .getManyAndCount();

      this.logger.log(
        `Get all promotions :: ${JSON.stringify({ query, filter })}`,
      );

      return {
        message: 'Successful',
        offset,
        limit,
        total: count,
        hasNext: count > offset + limit,
        data: promotions,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async getOne(id: string): Promise<Result<Promotion>> {
    try {
      const promotion = await this.promotionRepository.findOne({
        where: {
          id,
        },
      });

      return {
        message: 'Get promotion successfully',
        data: promotion,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async getValue(code: string) {
    try {
      const promotion = await this.promotionRepository.findOne({
        where: {
          code,
          isDeleted: false,
          isActive: true,
        },
      });

      if (!promotion) {
        throw new HttpException(
          PromotionErrorMessage['promotion_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      if (this.$isPromotionExpired(promotion)) {
        throw new HttpException(
          PromotionErrorMessage['promotion_expired'],
          HttpStatus.BAD_REQUEST,
        );
      }

      if (this.$isPromotionMaxUsed(promotion)) {
        throw new HttpException(
          PromotionErrorMessage['promotion_max_used'],
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        message: 'Get promotion successfully',
        data: {
          ...omit(promotion, [
            'createdBy',
            'isActive',
            'usedTimes',
            'maxUsedTimes',
            'expiredAt',
            'createdAt',
            'updatedAt',
            'isDeleted',
            'deletedAt',
          ]),
        },
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const promotion = await this.promotionRepository.findOne({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!promotion) {
        throw new HttpException(
          PromotionErrorMessage['promotion_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      await this.promotionRepository.update(
        {
          id,
        },
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
      );

      return;
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async updateStatus(id: string, body: UpdateStatusPromotion) {
    try {
      const promotion = await this.promotionRepository.findOne({
        where: {
          id,
        },
      });

      if (!promotion) {
        throw new HttpException(
          PromotionErrorMessage['promotion_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      await this.promotionRepository.update(
        {
          id,
        },
        {
          isActive: body.isActive,
        },
      );

      return;
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async restore(id: string) {
    try {
      const promotion = await this.promotionRepository.findOne({
        where: {
          id,
          isDeleted: true,
        },
      });

      if (!promotion) {
        throw new HttpException(
          PromotionErrorMessage['promotion_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      await this.promotionRepository.update(
        {
          id,
        },
        {
          isDeleted: false,
          deletedAt: null,
        },
      );

      return;
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  $isPromotionExpired(promotion: Promotion) {
    const { expiredAt } = promotion;
    if (expiredAt && new Date(expiredAt) < new Date()) {
      return true;
    }
    return false;
  }

  $isPromotionMaxUsed(promotion: Promotion) {
    const { maxUsedTimes } = promotion;
    if (maxUsedTimes && maxUsedTimes <= promotion.usedTimes) {
      return true;
    }
    return false;
  }

  $generateCode(typeDiscount: string) {
    try {
      const codePrefix = {
        product: 'PD',
        shipping: 'SH',
      };
      const prefix = codePrefix[typeDiscount];

      return `${prefix}${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
