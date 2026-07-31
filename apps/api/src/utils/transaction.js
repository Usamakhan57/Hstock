import mongoose from 'mongoose';

let transactionsSupported = null;

function isTransactionUnsupported(error) {
  return (
    error?.code === 20
    || error?.codeName === 'IllegalOperation'
    || String(error?.message || '').includes('Transaction numbers are only allowed')
    || String(error?.message || '').includes('replica set')
    || String(error?.message || '').includes('mongos')
  );
}

async function detectTransactionSupport() {
  if (transactionsSupported !== null) return transactionsSupported;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Lightweight ping inside a transaction
    await mongoose.connection.db.command({ ping: 1 }, { session });
    await session.commitTransaction();
    transactionsSupported = true;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }
    transactionsSupported = !isTransactionUnsupported(error) ? true : false;
    if (!isTransactionUnsupported(error)) {
      // Unexpected error during probe — assume unsupported to stay safe on standalone.
      transactionsSupported = false;
    }
  } finally {
    session.endSession();
  }

  return transactionsSupported;
}

/**
 * Run work inside a MongoDB transaction when supported (replica set / mongos).
 * Falls back to non-transactional execution on standalone MongoDB.
 * @param {(session: import('mongoose').ClientSession | null) => Promise<T>} work
 * @returns {Promise<T>}
 * @template T
 */
export async function withTransaction(work) {
  const supported = await detectTransactionSupport();
  if (!supported) {
    return work(null);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }

    if (isTransactionUnsupported(error)) {
      transactionsSupported = false;
      return work(null);
    }

    throw error;
  } finally {
    session.endSession();
  }
}

export function resetTransactionSupportCache() {
  transactionsSupported = null;
}

export default withTransaction;
