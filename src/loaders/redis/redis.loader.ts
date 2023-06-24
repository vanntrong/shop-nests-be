import configuration from '@/configs/configuration';
import { CacheModule, Logger } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';

export class RedisLoader {
  static init() {
    const logger = new Logger('RedisModule');
    const config = configuration();
    logger.log(
      `Redis module is loading on ${config.redis.host}:${config.redis.port}...`,
    );

    return CacheModule.register({
      isGlobal: true,
      store: redisStore as any,
      host: config.redis.host,
      port: config.redis.port,
    });
  }
}
