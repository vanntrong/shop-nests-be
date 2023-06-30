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
import { ONE_MILLION_VND, TWO_MILLIONS_VND } from '@/configs/money';
import { numberToCurrency } from '@/utils/currency';
import { Cart } from '@/entities/cart/cart.entity';
import { CartProduct } from '@/entities/cartProduct/cartProduct.entity';
import { MailService } from '../mail/mail.service';

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

    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,

    @InjectRepository(CartProduct)
    private readonly cartProductRepository: Repository<CartProduct>,

    private readonly shipService: ShipService,
    private readonly promotionService: PromotionsService,
    private readonly mailService: MailService,
  ) {
    this.logger = new Logger(OrdersService.name);
  }

  /**
   * This function creates an order, calculates the total value, applies promotions and points, saves
   * the order and its products, and creates a shipping order.
   * @param {CreateOrderDto} body - The request body containing information about the order to be
   * created, including the customer's name, phone number, address, email, note, and a list of products
   * with their quantities.
   * @param {string} [userId] - The `userId` parameter is an optional string parameter that represents
   * the ID of the user who is creating the order. If this parameter is provided, the function will
   * perform additional operations related to the user's points and promotions. If it is not provided,
   * these operations will be skipped.
   * @returns an object with the `products` and `order` properties of the `shipOrderBody` object.
   *
   * Business logic:
   * - If user buy more than 2 millions VND, the order will be free ship.
   * - Otherwise, fee ship is 30.000 VND.
   * - If user use point, the point will be reduced and the value of order will be reduced. - 1 point = 1000 VND.
   * - The minimum point user can use is 20 point
   * - If user use promotion reduce money, the value of order will be reduced. Maximum reduce money is 1 million VND.
   * - If user use promotion free ship and the value of order is less than 2 millions VND, the order will be free ship.
   * - If user buy more than 1 million VND, the user will earn 10 point - 10 point = 10.000 VND.
   */
  async create(body: CreateOrderDto, userId?: string) {
    try {
      let totalValue = 0; // total value of order
      let actualValue = 0; // value after user used point or apply promotion
      let pointUsed: number | null = null; // point used in order
      let pointEarned: number | null = null; // point earned after order
      let isFreeShip = false; // check if order is free ship
      let promotionUsed: Promotion | null = null; // promotion used in order
      let cart: Cart = null;

      const { products } = await this.$validateProducts(body.products);

      products.forEach((product, index) => {
        const productPrice = this.$checkProductPrice(product);

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
        cart = await this.cartRepository.findOne({
          where: {
            user: {
              id: userId,
            },
          },
        });
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

      const order = await this.orderRepository.save({
        name: body.name,
        phone: body.phone,
        address: body.address,
        district: body.district,
        email: body.email,
        note: body.note,
        province: body.province,
        ward: body.ward,
        feeShip: isFreeShip ? 0 : numberToCurrency(30, 'thousand'),
        pointUsed,
        value: totalValue,
        actualValue,
        pointEarned,
        promotionUsed,
        userId: userId ? userId : null,
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
          is_freeship: 1,
          pick_money: order.actualValue + order.feeShip,
          value: order.value,
          transport: 'road',
          deliver_option: 'none',
          note: order.note,
        },
      };

      // const res: any = await this.shipService.createOrder(shipOrderBody);

      this.mailService.sendMailOrderSuccess(
        order.name,
        order.email,
        orderProducts,
      );

      this.mailService.sendMailOrderSuccessAdmin(
        order.name,
        order.email,
        order.address +
          ', ' +
          order.ward +
          ', ' +
          order.district +
          ', ' +
          order.province,
        order.phone,
        orderProducts,
      );

      if (cart) {
        this.cartProductRepository
          .createQueryBuilder('cartProduct')
          .delete()
          .from(CartProduct)
          .where('cartId = :cartId', { cartId: cart.id })
          .execute();
      }

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

  async findMyOrders(_query: Query, _filter: Filter, userId: string) {
    try {
      const {
        offset = 0,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'asc',
      } = _query;
      const [orders, count] = await this.orderRepository
        .createQueryBuilder('order')
        .where('order.userId = :userId', { userId })
        .leftJoinAndSelect('order.orderProducts', 'orderProduct')
        .leftJoinAndSelect('orderProduct.product', 'product')
        .skip(offset)
        .take(limit)
        .orderBy(`order.${sortBy}`, sortOrder === 'asc' ? 'ASC' : 'DESC')
        .select([
          'order',
          'orderProduct',
          'product.id',
          'product.name',
          'product.thumbnailUrl',
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
      throw error;
    }
  }

  async countPoint(total: number) {
    try {
      if (!total || total < ONE_MILLION_VND)
        return {
          message: 'Successful',
          data: {
            pointEarned: 0,
          },
        };

      const pointEarned = Number((total / ONE_MILLION_VND).toFixed(1)) * 10;

      return {
        message: 'Successful',
        data: {
          pointEarned,
        },
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

      const {
        data: { pointEarned },
      } = await this.countPoint(totalValue);

      if (pointEarned === 0) return userPointEarned;

      await this.userRepository.update(
        {
          id: userId,
        },
        {
          point: () => `point + ${pointEarned}`,
        },
      );

      userPointEarned.pointEarned = pointEarned;

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
