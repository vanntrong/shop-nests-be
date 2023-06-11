import { Order } from '@/entities/order/order.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './orders.dto';
import { OrderProduct } from '@/entities/orderProduct/orderProduct.entity';
import { Product } from '@/entities/product/product.entity';
import { OrderErrorMessage } from './orders.errorMessage';
import { ShipService } from '../ship/ship.service';

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

      return {
        order,
        orderProducts,
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
