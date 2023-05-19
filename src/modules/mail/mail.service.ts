import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  logger: Logger = new Logger(MailService.name);
  constructor() {
    this.logger.log(`MailService initialized`);
  }
}
