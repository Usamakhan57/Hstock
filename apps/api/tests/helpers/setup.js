import './env-bootstrap.js';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { ensureDefaultConfigs } from '../../src/services/config.service.js';

let ready;

export async function setupTestDb() {
  if (!ready) {
    ready = (async () => {
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
  ready = undefined;
}

export default {
  setupTestDb,
  resetDb,
  teardownTestDb,
};
