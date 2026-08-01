/**
 * Must be imported before any src/ module that loads config/env.js.
 */
process.env.NODE_ENV = 'test';
// Placeholder URI — tests/helpers/setup.js replaces this with mongodb-memory-server.
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/apnastore_test';
process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'apnastore_test';
process.env.USE_MEMORY_MONGO = process.env.USE_MEMORY_MONGO || 'true';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-min';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-min';
process.env.CREDENTIALS_ENCRYPTION_KEY = 'test-credentials-encryption-key-32chars!!';
process.env.DISPUTE_CREDENTIAL_TTL_DAYS = '30';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.ENABLE_JOBS = 'false';
process.env.APP_URL = 'http://localhost:4000';
process.env.CRYPTOMUS_MODE = 'sandbox';
process.env.CRYPTOMUS_ENFORCE_IP_WHITELIST = 'false';
process.env.TELEGRAM_ENABLED = process.env.TELEGRAM_ENABLED || 'false';
process.env.TELEGRAM_MODE = process.env.TELEGRAM_MODE || 'polling';
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
process.env.TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '';
process.env.TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
process.env.TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || '';
