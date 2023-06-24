import { A_MONTH_IN_MILLISECONDS } from '@/configs/constants';
import { Order } from '@/entities/order/order.entity';
import { Product } from '@/entities/product/product.entity';
import { User } from '@/entities/user/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class StatsService {
  logger: Logger;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    this.logger = new Logger(StatsService.name);
  }

  async getStats() {
    try {
      const orders = await this.orderRepository.find({
        relations: ['orderProducts', 'orderProducts.product'],
      });
      const totalOrders = orders.length;
      const totalSales = orders.reduce((acc, order) => {
        return acc + order.value;
      }, 0);
      const averageOrderValue = totalSales / totalOrders;

      const topSellingProducts = await this.productRepository
        .createQueryBuilder('product')
        .innerJoin('product.orderProducts', 'orderProducts')
        .select(
          'product.id, product.name, product.thumbnailUrl ,SUM(orderProducts.quantity) as totalQuantity',
        )
        .groupBy('product.id')
        .orderBy('totalQuantity', 'DESC')
        .limit(5)
        .getRawMany();

      const productAvailability = await this.productRepository
        .createQueryBuilder('product')
        .where('product.inventory > 0')
        .andWhere('product.isDeleted = false')
        .select(
          'product.id, product.name, product.inventory, product.thumbnailUrl',
        )
        .getRawMany();

      const lowStockProducts = await this.productRepository
        .createQueryBuilder('product')
        .where('product.inventory <= 5')
        .andWhere('product.inventory > 0')
        .andWhere('product.isDeleted = false')
        .select(
          'product.id, product.name, product.inventory, product.thumbnailUrl',
        )
        .getRawMany();

      const outOfStockProducts = await this.productRepository
        .createQueryBuilder('product')
        .where('product.inventory = 0')
        .andWhere('product.isDeleted = false')
        .select(
          'product.id, product.name, product.inventory, product.thumbnailUrl',
        )
        .getRawMany();

      const users = await this.userRepository.find({
        where: {
          isDeleted: false,
          roles: '{user}',
        },
      });
      const totalCustomers = users.length;
      const newCustomers = users.filter((user) => {
        return Date.now() - user.createdAt.getTime() < A_MONTH_IN_MILLISECONDS; // 30 days
      }).length;

      return {
        totalOrders,
        totalSales,
        averageOrderValue,
        topSellingProducts,
        productAvailability,
        lowStockProducts,
        outOfStockProducts,
        totalCustomers,
        newCustomers,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
