import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter, errorHandler, notFoundHandler } from './middleware/common.js';

export function createApp() {
  const app = express();
  if (env.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    // The SPA is served from this origin in production and loads Google Fonts + Razorpay Checkout.
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", 'https://checkout.razorpay.com'],
        'media-src': ["'self'", 'blob:'], // the admin panel plays call recordings from a blob: URL
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'frame-src': ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
        'connect-src': ["'self'", 'https://lumberjack.razorpay.com'],
        'img-src': ["'self'", 'data:'],
      },
    },
  }));
  app.use(cors({
    origin: env.corsOrigins.length ? env.corsOrigins : env.isProd ? false : true,
    credentials: false,
  }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use('/api', apiLimiter, routes);
  app.use('/api', notFoundHandler);

  // Optional: serve the built React app from the same server (single-deploy setup).
  if (env.serveFrontend) {
    const index = path.join(env.frontendDist, 'index.html');
    if (fs.existsSync(index)) {
      app.use(express.static(env.frontendDist, { index: false, maxAge: '1h' }));
      app.get('*', (_req, res) => res.sendFile(index));
    } else {
      console.warn(`[app] SERVE_FRONTEND is on but ${index} was not found — run "npm run build" in /frontend first.`);
    }
  }

  app.use(errorHandler);
  return app;
}
