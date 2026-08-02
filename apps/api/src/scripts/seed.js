/**
 * Seed default MongoDB configuration documents + marketplace services.
 * Usage: node src/scripts/seed.js
 */
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';
import { ensureDefaultConfigs } from '../services/config.service.js';
import { seedMarketplaceCategories } from '../services/categorySeed.service.js';
import { User, AdminProfile } from '../models/index.js';
import { hashPassword } from '../utils/password.js';
import { USER_ROLES } from '../constants/roles.js';
import { env } from '../config/env.js';

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin.apnastore@gmail.com';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required (min 8 chars). No default password is hardcoded.',
    );
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      name: 'ApnaStore Admin',
      roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
      emailVerified: true,
      verificationStatus: 'verified',
    });

    await AdminProfile.create({
      user: user._id,
      displayName: 'ApnaStore Admin',
      staffRole: USER_ROLES.SUPER_ADMIN,
    });

    logger.info('Seeded super admin user', { email });
  } else {
    logger.info('Admin user already exists', { email });
  }
}

async function main() {
  await connectDatabase();
  const configs = await ensureDefaultConfigs();
  logger.info('Default configs ensured', {
    sellerRegistrationFee: configs.system.sellerRegistrationFee,
    defaultCommission: configs.commission.defaultPercent,
    maintenanceMode: configs.platform.maintenanceMode,
  });

  if (!env.isProduction || process.env.SEED_ADMIN === 'true') {
    await seedAdmin();
  }

  // Always ensure default marketplace services exist (idempotent by slug).
  if (process.env.SEED_CATEGORIES !== 'false') {
    const categorySeed = await seedMarketplaceCategories();
    logger.info('Marketplace services ensured', categorySeed);
  }

  await disconnectDatabase();
}

main().catch(async (error) => {
  logger.error('Seed failed', { message: error.message, stack: error.stack });
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
