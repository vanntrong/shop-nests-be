import { Order } from '@/entities/order/order.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateOrderDto,
  CreateOrderProductDto,
  UpdateShipmentDto,
} from './orders.dto';
import { OrderProduct } from '@/entities/orderProduct/orderProduct.entity';
import { Product } from '@/entities/product/product.entity';
import { OrderErrorMessage } from './orders.errorMessage';
import { ShipService } from '../ship/ship.service';
import { CreateShipDto } from '../ship/ship.dto';
import { constants } from '@/configs/constants';
import { gamToKg } from '@/utils/convert';
import { Filter, Query } from '@/types/common';
import { User } from '@/entities/user/user.entity';
import { pointToMoney } from '@/utils/helper';
import { Promotion } from '@/entities/promotion/promotion.entity';
import { PromotionsService } from '../promotions/promotions.service';
import { TWO_MILLIONS_VND } from '@/configs/money';

@Injectable()
export class OrdersService {
  logger: Logger;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User) private readonly userRepository: Repository<User>,

    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,

    private readonly shipService: ShipService,
    private readonly promotionService: PromotionsService,
  ) {
    this.logger = new Logger(OrdersService.name);
  }

  async create(body: CreateOrderDto, userId?: string) {
    try {
      let totalValue = 0; // total value of order
      let totalWeight = 0; // total weight of order
      let actualValue = 0; // value after user used point or apply promotion
      let pointUsed: number | null = null; // point used in order
      let pointEarned: number | null = null; // point earned after order
      let isFreeShip = false; // check if order is free ship
      let promotionUsed: Promotion | null = null; // promotion used in order

      const { products } = await this.$validateProducts(body.products);

      products.forEach((product, index) => {
        const productPrice = this.$checkProductPrice(product);

        totalWeight += product.weight * body.products[index].quantity;
        totalValue += productPrice * body.products[index].quantity;
        actualValue += productPrice * body.products[index].quantity;
      });

      if (userId) {
        if (body.pointUsed) {
          const { isValid, reduceMoney } = await this.$checkAndReduceUserPoint(
            userId,
            body.pointUsed,
          );

          if (isValid) {
            actualValue -= reduceMoney;
            pointUsed = body.pointUsed;
          }
        }

        const userPointEarned = await this.$addPointForUser(userId, totalValue);
        pointEarned = userPointEarned.pointEarned;
      }

      if (body.promotionCode) {
        const promotionReduce = await this.$checkAndReducePromotion(
          body.promotionCode,
          totalValue,
        );
        promotionUsed = promotionReduce.promotion;

        if (promotionReduce.isFreeShip) {
          isFreeShip = true;
        } else {
          actualValue -= promotionReduce.reduceMoney;
        }
      }

      if (totalValue > TWO_MILLIONS_VND) {
        isFreeShip = true;
      }

      const feeShip = await this.shipService.getFee({
        address: body.address,
        district: body.district,
        province: body.province,
        street: body.street,
        value: actualValue.toString(),
        ward: body.ward,
        weight: totalWeight.toString(),
        deliver_option: body.deliver_option,
      });

      const order = await this.orderRepository.save({
        name: body.name,
        phone: body.phone,
        address: body.address,
        district: body.district,
        email: body.email,
        note: body.note,
        province: body.province,
        ward: body.ward,
        feeShip: feeShip.data.fee,
        pointUsed,
        value: totalValue,
        actualValue,
        pointEarned,
        promotionUsed,
      });

      const orderProducts = await Promise.all(
        products.map((product, index) => {
          product.inventory -= body.products[index].quantity;
          this.productRepository.save(product);
          return this.orderProductRepository.save({
            order,
            product,
            quantity: body.products[index].quantity,
            price: product.price,
          });
        }),
      );

      const shipOrderBody: CreateShipDto = {
        products: orderProducts.map((orderProduct, index) => {
          return {
            name: orderProduct.product.name,
            weight: gamToKg(orderProduct.product.weight),
            quantity: orderProduct.quantity,
            product_code: index,
          };
        }),
        order: {
          id: order.id,
          pick_name: constants.PICK_NAME,
          ...constants.PICK_ADDRESS,
          pick_tel: constants.PICK_TEL,
          tel: order.phone,
          name: order.name,
          address: order.address,
          province: order.province,
          district: order.district,
          ward: order.ward,
          hamlet: 'Khác',
          is_freeship: isFreeShip ? 1 : 0,
          pick_money: order.actualValue,
          value: order.value,
          transport: 'road',
          deliver_option: 'none',
          note: order.note,
        },
      };

      // const res: any = await this.shipService.createOrder(shipOrderBody);

      return {
        ...shipOrderBody,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async findAll(_query: Query, _filter: Filter) {
    try {
      const { offset = 0, limit = 10, sortBy, sortOrder } = _query;
      const { keyword = '' } = _filter;

      const [orders, count] = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.orderProducts', 'orderProduct')
        .leftJoinAndSelect('orderProduct.product', 'product')
        .leftJoinAndSelect('order.promotionUsed', 'promotionUsed')
        .where('order.name ILIKE :keyword', {
          keyword: `%${keyword}%`,
        })
        .skip(offset)
        .take(limit)
        .orderBy(
          sortBy ? `order.${sortBy}` : 'order.createdAt',
          sortOrder === 'asc' ? 'ASC' : 'DESC',
        )
        .select([
          'order',
          'orderProduct',
          'product.name',
          'product.thumbnailUrl',
          'promotionUsed.code',
        ])
        .getManyAndCount();

      this.logger.log('fetch orders: ', JSON.stringify(_query));

      return {
        message: 'Successful',
        offset,
        limit,
        total: count,
        hasNext: count > offset + limit,
        data: orders,
      };
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async updateShipment(body: UpdateShipmentDto) {
    try {
      const { reason_code, reason, status_id, partner_id, fee } = body;
      const order = await this.orderRepository.findOne({
        where: {
          id: partner_id,
        },
      });

      if (!order) {
        throw new HttpException(
          OrderErrorMessage['order_not_found'],
          HttpStatus.NOT_FOUND,
        );
      }

      await this.orderRepository.save({
        ...order,
        statusId: Number(status_id),
        reasonCode: reason_code,
        reason,
        feeShip: Number(fee),
        value: order.value - order.feeShip + Number(fee),
      });

      return {
        message: 'Successful',
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async $addPointForUser(userId: string, totalValue: number) {
    try {
      const userPointEarned = {
        pointEarned: null,
      };

      if (totalValue < TWO_MILLIONS_VND) return userPointEarned;

      await this.userRepository.update(
        {
          id: userId,
        },
        {
          point: () => `point + ${30}`,
        },
      );

      userPointEarned.pointEarned = 30;

      return userPointEarned;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async $checkAndReduceUserPoint(userId: string, pointUsed: number) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: userId,
        },
      });

      if (user.point < pointUsed) {
        throw new HttpException(
          OrderErrorMessage['not_enough_point'],
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userRepository.save({
        ...user,
        point: user.point - pointUsed,
      });

      return {
        isValid: true,
        reduceMoney: pointToMoney(pointUsed), // 30 point to 30000vnd
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async $checkAndReducePromotion(promotionCode: string, totalValue: number) {
    try {
      const promotion = await this.promotionService.getValue(promotionCode);
      const reducePromotion = this.promotionService.$checkPromotion(
        promotion.data,
        totalValue,
      );
      reducePromotion.promotion = promotion.data;

      this.promotionRepository.update(
        {
          id: promotion.data.id,
        },
        {
          usedTimes: () => `used_times + ${1}`,
        },
      );

      return reducePromotion;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async $validateProducts(_products: CreateOrderProductDto[]) {
    try {
      const products = await Promise.all(
        _products.map((product) =>
          this.productRepository.findOne({
            where: {
              id: product.productId,
              isDeleted: false,
              isActive: true,
            },
          }),
        ),
      );

      const isProductsNotAvailable = products.some((product, index) => {
        return !product || _products[index].quantity > product.inventory;
      });

      if (isProductsNotAvailable) {
        throw new HttpException(
          OrderErrorMessage['product_not_available'],
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        products,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async $isProductAvailable(productId: string, quantity: number) {
    try {
      const product = await this.productRepository.findOne({
        where: {
          id: productId,
          isDeleted: false,
        },
      });

      if (!product || product.inventory < quantity) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  $checkProductPrice(product: Product) {
    const { salePrice, saleEndAt } = product;

    if (salePrice && saleEndAt && new Date(saleEndAt) > new Date()) {
      return salePrice;
    }

    return product.price;
  }
}
