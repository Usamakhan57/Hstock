import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { httpLogger, logger } from './config/logger.js';
import { ensureUploadDirectories } from './config/uploads.js';
import {
  errorHandler,
  globalRateLimiter,
  notFoundHandler,
  requestIdMiddleware,
  sanitizeRequest,
} from './middlewares/index.js';
import routes from './routes/index.js';

ensureUploadDirectories();

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
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
    message: 'HStock API',
    data: {
      phase: 'commerce-core',
      docs: '/api/v1',
      health: '/health',
    },
    errors: null,
    meta: null,
  });
});

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
