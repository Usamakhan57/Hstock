import http from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeJobs } from './jobs/index.js';
import { initializeQueues } from './queues/index.js';
import { initializeEvents } from './events/index.js';
import { ensureDefaultConfigs } from './services/config.service.js';
import { initializeSocket, closeSocket } from './realtime/socket.server.js';
import app from './app.js';

let server;

async function bootstrap() {
  await connectDatabase();
  await ensureDefaultConfigs();
  initializeEvents();
  initializeQueues();
  initializeJobs();

  server = http.createServer(app);
  initializeSocket(server);

  try {
    const { initializeTelegram } = await import('./services/telegram.service.js');
    await initializeTelegram();
  } catch (error) {
    logger.warn('Telegram initialization skipped', { message: error.message });
  }

  server.listen(env.PORT, env.HOST, () => {
    logger.info(`${env.APP_NAME} listening`, {
      host: env.HOST,
      port: env.PORT,
      env: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
      health: `http://${env.HOST}:${env.PORT}/health`,
      socket: `http://${env.HOST}:${env.PORT}/socket.io`,
    });
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);

  const forceTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 15000);
  forceTimer.unref();

  try {
    try {
      const { stopPolling } = await import('./services/telegram.service.js');
      stopPolling();
    } catch {
      // ignore
    }
    await closeSocket();
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await disconnectDatabase();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { message: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    message: error.message,
    stack: error.stack,
  });
  shutdown('uncaughtException');
});

bootstrap().catch((error) => {
  logger.error('Failed to start server', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
