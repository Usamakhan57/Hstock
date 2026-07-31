/**
 * Must be imported before any src/ module that loads config/env.js.
 */
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hstock_phase2_test';
process.env.MONGODB_DB_NAME = 'hstock_phase2_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-min';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-min';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.ENABLE_JOBS = 'false';
process.env.APP_URL = 'http://localhost:4000';
process.env.CRYPTOMUS_MODE = 'sandbox';
process.env.CRYPTOMUS_ENFORCE_IP_WHITELIST = 'false';
