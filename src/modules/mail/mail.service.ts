import { ADMIN_EMAIL } from '@/configs/constants';
import { OrderProduct } from '@/entities/orderProduct/orderProduct.entity';
import { numberToVND } from '@/utils/currency';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  logger: Logger = new Logger(MailService.name);
  constructor(private mailerService: MailerService) {
    this.logger.log(`MailService initialized`);
  }

  async sendMailRegister(name: string, email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Chào mừng bạn đến với Yến sào Khánh Hòa',
      template: '../templates/registerSuccess',
      context: {
        name,
      },
    });
  }

  async sendMailOrderSuccess(name: string, email: string, products: any) {
    products = products.map((product) => ({
      ...product,
      total: product.price * product.quantity,
    }));

    const total = products.reduce((acc, product) => {
      return acc + product.total;
    }, 0);
    await this.mailerService.sendMail({
      to: email,
      subject: 'Đặt hàng thành công',
      template: '../templates/userCreateOrderSuccess',
      context: {
        name,
        products,
        total,
      },
    });
  }

  async sendMailOrderSuccessAdmin(
    name: string,
    email: string,
    address: string,
    phone: string,
    products: any,
  ) {
    products = products.map((product) => ({
      ...product,
      total: product.price * product.quantity,
    }));

    const total = products.reduce((acc, product) => {
      return acc + product.total;
    }, 0);

    await this.mailerService.sendMail({
      to: ADMIN_EMAIL,
      subject: 'Đơn hàng mới',
      template: '../templates/adminCreateOrderSuccess',
      context: {
        name,
        email,
        phone,
        address,
        products,
        total,
      },
    });
  }
}
