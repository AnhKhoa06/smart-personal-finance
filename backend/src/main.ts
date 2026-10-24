import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Tất cả API nằm dưới /api (khi triển khai, Nginx chỉ cần chuyển /api về backend).
  app.setGlobalPrefix('api');

  // Phía sau Nginx: lấy IP thật của client để giới hạn số lần thử đúng người.
  if (config.get<string>('NODE_ENV') === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(cookieParser());
  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_URL'),
    credentials: true, // cho phép trình duyệt gửi cookie refresh token
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // bỏ field thừa
      forbidNonWhitelisted: true, // và báo lỗi nếu client gửi field lạ
      transform: true,
    }),
  );

  await app.listen(config.get<string>('PORT') ?? 3000);
}
bootstrap();
