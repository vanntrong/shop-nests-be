import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './errors/http-execption.filter';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'log', 'error'],
  });

  app.enableCors({
    origin: process.env.HOSTS.split(','),
  });

  // pipe
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  // prefix
  app.setGlobalPrefix('api/v1');
  const PORT = process.env.PORT || 3000;

  await app.listen(PORT);

  logger.log(`Application listening on port ${PORT}`, 'Bootstrap');
}
bootstrap();
