/**
 * PM2 production process file for Hostinger VPS.
 * Usage: pm2 start ecosystem.config.js --env production
 *
 * Note: PM2 loads this via CommonJS require. A .cjs twin also exists.
 */
module.exports = {
  apps: [
    {
      name: 'apnastore-api',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        ENABLE_JOBS: 'true',
      },
      error_file: 'logs/error/pm2-error.log',
      out_file: 'logs/app/pm2-out.log',
      merge_logs: true,
      time: true,
      kill_timeout: 10000,
    },
  ],
};
