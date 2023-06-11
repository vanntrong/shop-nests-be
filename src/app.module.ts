import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './configs/configuration';
import { DatabaseLoader } from './loaders/database/database.loader';
import { RedisLoader } from './loaders/redis/redis.loader';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShipModule } from './modules/ship/ship.module';
import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development',
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseLoader.init(),
    RedisLoader.init(),
    MailModule,
    AuthModule,
    UserModule,
    CategoriesModule,
    UploadModule,
    ProductsModule,
    OrdersModule,
    ShipModule,
    CartModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
