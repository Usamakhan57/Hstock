import { env } from './env.js';

export const corsOptions = {
  origin(origin, callback) {
    // Non-browser clients (webhooks, health checks, curl) may omit Origin
    if (!origin) {
      callback(null, true);
      return;
    }

    if (env.corsOrigins.includes('*')) {
      // Credentials + wildcard is unsafe — reject in all environments
      callback(new Error('CORS wildcard is not allowed with credentials'));
      return;
    }

    if (env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400,
};

export default corsOptions;
