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
}
