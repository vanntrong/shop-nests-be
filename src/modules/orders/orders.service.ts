import { Order } from '@/entities/order/order.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto, UpdateShipmentDto } from './orders.dto';
import { OrderProduct } from '@/entities/orderProduct/orderProduct.entity';
import { Product } from '@/entities/product/product.entity';
import { OrderErrorMessage } from './orders.errorMessage';
import { ShipService } from '../ship/ship.service';
import { CreateShipDto } from '../ship/ship.dto';
import { constants } from '@/configs/constants';
import { gamToKg } from '@/utils/convert';
import { Filter, Query } from '@/types/common';

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

    private readonly shipService: ShipService,
  ) {
    this.logger = new Logger(OrdersService.name);
  }

  async create(body: CreateOrderDto) {
    try {
      const products = await Promise.all(
        body.products.map((product) =>
          this.productRepository.findOne({
            where: {
              id: product.productId,
              isDeleted: false,
            },
          }),
        ),
      );

      const isProductsNotAvailable = products.some((product, index) => {
        return !product || body.products[index].quantity > product.inventory;
      });

      if (isProductsNotAvailable) {
        throw new HttpException(
          OrderErrorMessage['product_not_available'],
          HttpStatus.BAD_REQUEST,
        );
      }

      let totalValue = 0;
      let totalWeight = 0;

      products.forEach((product, index) => {
        totalWeight += product.weight * body.products[index].quantity;
        totalValue += product.price * body.products[index].quantity;
      });

      const feeShip = await this.shipService.getFee({
        address: body.address,
        district: body.district,
        province: body.province,
        street: body.street,
        value: totalValue.toString(),
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
        value: totalValue,
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
          is_freeship: 0,
          pick_money: order.value,
          value: order.value,
          transport: 'road',
          deliver_option: 'none',
          note: order.note,
        },
      };

      const res: any = await this.shipService.createOrder(shipOrderBody);

      return {
        ...res,
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
}
