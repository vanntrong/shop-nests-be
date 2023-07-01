import { ADMIN_EMAIL, FE_URL } from '@/configs/constants';
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

  async sendMailOrderSuccess(
    name: string,
    email: string,
    totalValue: number,
    actualValue: number,
    products: any,
  ) {
    products = products.map((product) => ({
      ...product,
      total: product.price * product.quantity,
    }));

    const saleValue = totalValue > actualValue ? totalValue - actualValue : 0;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Đặt hàng thành công',
      template: '../templates/userCreateOrderSuccess',
      context: {
        name,
        products,
        totalValue,
        actualValue,
        saleValue,
      },
    });
  }

  async sendMailOrderSuccessAdmin(
    name: string,
    email: string,
    address: string,
    phone: string,
    totalValue: number,
    actualValue: number,
    products: any,
  ) {
    products = products.map((product) => ({
      ...product,
      total: product.price * product.quantity,
    }));

    const saleValue = totalValue > actualValue ? totalValue - actualValue : 0;

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
        totalValue,
        actualValue,
        saleValue,
      },
    });
  }

  async sendMailSaleProduct(name: string, email: string, product: any) {
    product.link = FE_URL + '/san-pham/' + product.slug;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Thông báo giảm giá',
      template: '../templates/saleProduct',
      context: {
        name,
        product,
      },
    });
  }
}
