import './env-bootstrap.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from '../../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { ensureDefaultConfigs } from '../../src/services/config.service.js';

let ready;
let memoryServer;

async function ensureMemoryMongo() {
  if (process.env.USE_MEMORY_MONGO === 'false') return;
  if (memoryServer) return;

  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  process.env.MONGODB_URI = uri;
  env.MONGODB_URI = uri;
}

export async function setupTestDb() {
  if (!ready) {
    ready = (async () => {
      await ensureMemoryMongo();
      await connectDatabase();
      await mongoose.connection.dropDatabase();
      await ensureDefaultConfigs();
    })();
  }
  await ready;
}

export async function resetDb() {
  await setupTestDb();
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  await ensureDefaultConfigs();
}

export async function teardownTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await disconnectDatabase();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
  ready = undefined;
}

export default {
  setupTestDb,
  resetDb,
  teardownTestDb,
};
