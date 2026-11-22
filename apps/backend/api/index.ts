import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

const server = express();
let appReady: Promise<void> | null = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });
  configureApp(app);
  await app.init();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appReady) {
    appReady = bootstrap();
  }
  await appReady;
  server(req, res);
}
