import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const corsOrigin = process.env.CORS_ORIGIN;
  const defaultOrigin = ['http://localhost:4200'];
  const origins = corsOrigin
    ? corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultOrigin;

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? origins : origins,
    credentials: false
  });
  await app.listen(3000);
}

void bootstrap();
