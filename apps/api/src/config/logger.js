import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import { env } from './env.js';

const appLogDir = path.join(env.logPath, 'app');
const errorLogDir = path.join(env.logPath, 'error');
const httpLogDir = path.join(env.logPath, 'http');

for (const dir of [env.logPath, appLogDir, errorLogDir, httpLogDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return stack
      ? `${timestamp} ${level}: ${message}${rest}\n${stack}`
      : `${timestamp} ${level}: ${message}${rest}`;
  }),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: env.APP_NAME },
  transports: [
    new winston.transports.File({
      filename: path.join(appLogDir, 'application.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: path.join(errorLogDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

if (!env.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
} else {
  logger.add(
    new winston.transports.Console({
      level: 'info',
      format: fileFormat,
    }),
  );
}

export const httpLogger = winston.createLogger({
  level: 'http',
  format: fileFormat,
  defaultMeta: { service: `${env.APP_NAME}-http` },
  transports: [
    new winston.transports.File({
      filename: path.join(httpLogDir, 'http.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

export default logger;
