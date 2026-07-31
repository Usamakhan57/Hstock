process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hstock_phase2_test';
process.env.MONGODB_DB_NAME = 'hstock_phase2_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-min';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-min';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.ENABLE_JOBS = 'false';
process.env.APP_URL = 'http://localhost:4000';

const { default: mongoose } = await import('mongoose');
const { connectDatabase, disconnectDatabase } = await import('../../src/config/database.js');
const { ensureDefaultConfigs } = await import('../../src/services/config.service.js');

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
