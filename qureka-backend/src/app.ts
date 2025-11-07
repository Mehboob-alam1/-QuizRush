import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import router from './routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', true);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  app.use('/api/v1', router);

  app.get('/', (_req, res) => {
    res.json({
      name: 'Qureka Clone API',
      version: '1.0.0',
      status: 'online',
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

