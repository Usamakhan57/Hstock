import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('MongoDB connected', { db: env.MONGODB_DB_NAME });
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { message: error.message });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    maxPoolSize: env.isProduction ? 20 : 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (!isConnected && mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
}

export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || 'unknown',
    isConnected: mongoose.connection.readyState === 1,
    name: mongoose.connection.name || env.MONGODB_DB_NAME,
  };
}

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
};
