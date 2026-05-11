import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './modules/app.module';
import { PrismaService } from './modules/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prismaService = app.get(PrismaService);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.use('/api/tochka/webhook', express.text({ type: '*/*' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await prismaService.enableShutdownHooks(app);

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
