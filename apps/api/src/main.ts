import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { appVersion, validateConfig } from './common/config';

async function bootstrap() {
  validateConfig();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks(); // đóng kết nối CSDL gọn gàng khi nền tảng dừng container
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`BrewLite API ${appVersion()} đang chạy tại cổng ${port}`);
}
bootstrap();
