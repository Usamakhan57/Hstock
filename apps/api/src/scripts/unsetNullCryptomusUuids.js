/**
 * One-shot repair: MongoDB sparse unique indexes still index explicit null.
 * Unset cryptomusUuid where it is null so multiple unpaid invoices can exist.
 *
 * Usage: node src/scripts/unsetNullCryptomusUuids.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function unsetNulls(collectionName) {
  const col = mongoose.connection.db.collection(collectionName);
  const result = await col.updateMany(
    { cryptomusUuid: null },
    { $unset: { cryptomusUuid: '' } },
  );
  return result.modifiedCount || 0;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }
  await mongoose.connect(uri);
  const payments = await unsetNulls('payments');
  const deposits = await unsetNulls('walletdeposits');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ paymentsUnset: payments, depositsUnset: deposits }));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
