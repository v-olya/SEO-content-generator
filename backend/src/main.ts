import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:4200');

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: false,
  });

  app.enableShutdownHooks();

  await app.listen(3000);
}

void bootstrap();
