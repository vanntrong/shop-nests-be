import configuration from '@/configs/configuration';
import { Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

export class DatabaseLoader {
  static init() {
    const config = configuration();
    const logger = new Logger();
    logger.log(
      `Database module is loading on port ${config.database.port}...`,
      'DatabaseModule',
    );
    return TypeOrmModule.forRoot({
      ...config.database,
      type: 'postgres',
      entities: ['dist/entities/**/*.entity{.ts,.js}'],
      synchronize: true,
    });
  }
}
