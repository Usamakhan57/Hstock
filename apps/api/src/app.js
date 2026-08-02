import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from 'passport';

import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { httpLogger, logger } from './config/logger.js';
import { ensureUploadDirectories } from './config/uploads.js';
import { configureGooglePassport } from './config/googlePassport.js';
import {
  errorHandler,
  globalRateLimiter,
  notFoundHandler,
  requestIdMiddleware,
  sanitizeRequest,
} from './middlewares/index.js';
import routes from './routes/index.js';
import { MAX_IMAGE_UPLOAD_MB } from './constants/uploads.js';

ensureUploadDirectories();
configureGooglePassport();

const app = express();
const BODY_LIMIT = `${MAX_IMAGE_UPLOAD_MB}mb`;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(passport.initialize());

app.use(requestIdMiddleware);
app.use(helmet({
  contentSecurityPolicy: env.isProduction
    ? {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", ...env.corsOrigins, 'wss:', 'ws:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        frameAncestors: ["'none'"],
      },
    }
    : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
app.use(cookieParser());
app.use(
  '/uploads',
  express.static(env.uploadPath, {
    maxAge: '7d',
    fallthrough: true,
  }),
);
app.use(sanitizeRequest);
app.use(globalRateLimiter);

app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: {
      write(message) {
        httpLogger.http(message.trim());
        if (!env.isProduction) {
          logger.http(message.trim());
        }
      },
    },
  }),
);

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ApnaStore API',
    data: {
      phase: 'production',
      docs: '/api/v1',
      health: '/health',
      socket: '/socket.io',
    },
    errors: null,
    meta: null,
  });
});

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
