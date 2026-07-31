import mongoose from 'mongoose';

function isTransactionUnsupported(error) {
  return (
    error?.code === 20
    || error?.codeName === 'IllegalOperation'
    || String(error?.message || '').includes('Transaction numbers are only allowed')
  );
}

/**
 * Run work inside a MongoDB transaction when supported.
 * Falls back to non-transactional execution on standalone MongoDB.
 * @param {(session: import('mongoose').ClientSession | null) => Promise<T>} work
 * @returns {Promise<T>}
 * @template T
 */
export async function withTransaction(work) {
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
      return work(null);
    }

    throw error;
  } finally {
    session.endSession();
  }
}

export default withTransaction;
