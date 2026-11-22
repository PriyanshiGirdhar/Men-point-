import type { Express, Request, Response } from 'express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

const expressApp: Express = express();
let ready: Promise<void> | null = null;

function init() {
  if (!ready) {
    ready = (async () => {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
      configureApp(app);
      app.getHttpAdapter().getInstance().set('trust proxy', 1);
      await app.init();
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req: Request, res: Response) {
  await init();
  expressApp(req, res);
}
