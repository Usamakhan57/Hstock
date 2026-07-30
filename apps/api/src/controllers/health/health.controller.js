import { env } from '../../config/env.js';
import { getDatabaseStatus } from '../../config/database.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

export const getHealth = asyncHandler(async (_req, res) => {
  const db = getDatabaseStatus();

  return sendSuccess(res, {
    message: 'HStock API health check',
    data: {
      status: 'ok',
      service: env.APP_NAME,
      environment: env.NODE_ENV,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: db.status,
        connected: db.isConnected,
      },
    },
  });
});

export const getLiveness = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    message: 'Alive',
    data: {
      status: 'live',
      timestamp: new Date().toISOString(),
    },
  });
});

export const getReadiness = asyncHandler(async (_req, res) => {
  const db = getDatabaseStatus();

  if (!db.isConnected) {
    throw new AppError('Database not ready', 503, {
      code: 'NOT_READY',
      details: { database: db.status },
    });
  }

  return sendSuccess(res, {
    message: 'Ready',
    data: {
      status: 'ready',
      database: {
        status: db.status,
        connected: true,
        name: db.name,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

export default {
  getHealth,
  getLiveness,
  getReadiness,
};
