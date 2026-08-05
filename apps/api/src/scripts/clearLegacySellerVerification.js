/**
 * One-shot repair: clear Verified badge from approved sellers who never paid
 * and were never explicitly admin-verified (legacy approval conflation).
 *
 * Usage: node src/scripts/clearLegacySellerVerification.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);

  const col = mongoose.connection.db.collection('sellerprofiles');
  const filter = {
    verified: true,
    deleted: { $ne: true },
    $or: [
      { verificationSource: null },
      { verificationSource: { $exists: false } },
      { verificationSource: '' },
    ],
  };

  const matched = await col.countDocuments(filter);
  const result = await col.updateMany(filter, {
    $set: {
      verified: false,
      verificationStatus: 'unverified',
      verifiedAt: null,
      verificationFeePaid: null,
      verificationSource: null,
      verifiedBy: null,
    },
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    matched,
    modified: result.modifiedCount || 0,
  }));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
