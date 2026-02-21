import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS для мобильных приложений и веб-панели
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Слушаем на всех интерфейсах для доступа с мобильных устройств
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Also accessible from network: http://192.168.0.18:${port}`);
}
bootstrap();
