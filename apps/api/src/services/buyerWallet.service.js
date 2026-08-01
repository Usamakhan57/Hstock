import crypto from 'node:crypto';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { roundMoney } from '../helpers/money.helper.js';
import { generateTransferId } from '../helpers/id.helper.js';
import {
  creditAvailable,
  creditPending,
  releasePendingToAvailable,
  debitAvailable,
  creditRefund,
  applyAdjustment,
} from '../helpers/buyerWallet.helper.js';
import { LEDGER_ACCOUNT, LEDGER_DIRECTION, LEDGER_ENTRY_TYPE } from '../constants/ledger.js';
import { PAYMENT_STATUS } from '../constants/statuses.js';
import { DOMAIN_EVENTS } from '../constants/events.js';
import { emitDomainEvent } from '../events/bus.js';
import { env } from '../config/env.js';
import {
  BuyerWallet,
  BuyerWalletTransaction,
  WalletDeposit,
  User,
} from '../models/index.js';
import {
  BUYER_WALLET_TX_TYPE,
  BUYER_WALLET_TX_STATUS,
} from '../models/BuyerWalletTransaction.model.js';
import * as ledgerService from './ledger.service.js';
import * as cryptomusService from './cryptomus.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { logActivity } from './activity.service.js';

function depositLimits() {
  return {
    min: Number(env.BUYER_WALLET_MIN_DEPOSIT || 5),
    max: Number(env.BUYER_WALLET_MAX_DEPOSIT || 10000),
  };
}

function generateDepositNumber(purpose = 'deposit') {
  const prefix = purpose === 'topup' ? 'TOP' : 'DEP';
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  return `${prefix}-${ts}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function getOrCreateBuyerWallet(buyerId, session = null) {
  const query = BuyerWallet.findOne({ buyer: buyerId });
  if (session) query.session(session);
  let wallet = await query;
  if (wallet) return wallet;

  try {
    const created = await BuyerWallet.create(
      [{ buyer: buyerId, currency: 'USD' }],
      session ? { session } : undefined,
    );
    return Array.isArray(created) ? created[0] : created;
  } catch (error) {
    if (error?.code === 11000) {
      const again = BuyerWallet.findOne({ buyer: buyerId });
      if (session) again.session(session);
      return again.exec();
    }
    throw error;
  }
}

export function serializeBuyerWallet(wallet) {
  const doc = typeof wallet.toObject === 'function' ? wallet.toObject() : wallet;
  return {
    id: doc._id,
    buyer: doc.buyer,
    currency: doc.currency || 'USD',
    availableBalance: roundMoney(doc.availableBalance || 0),
    pendingBalance: roundMoney(doc.pendingBalance || 0),
    balance: roundMoney((doc.availableBalance || 0) + (doc.pendingBalance || 0)),
    totalDeposited: roundMoney(doc.totalDeposited || 0),
    totalSpent: roundMoney(doc.totalSpent || 0),
    totalRefunded: roundMoney(doc.totalRefunded || 0),
    frozen: Boolean(doc.frozen),
    frozenAt: doc.frozenAt || null,
    frozenReason: doc.frozenReason || null,
    lastTransactionAt: doc.lastTransactionAt || null,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
  };
}

async function saveWalletOptimistic(wallet, session = null) {
  const expectedVersion = (wallet.version || 1) - 1;
  const update = {
    availableBalance: wallet.availableBalance,
    pendingBalance: wallet.pendingBalance,
    totalDeposited: wallet.totalDeposited,
    totalSpent: wallet.totalSpent,
    totalRefunded: wallet.totalRefunded,
    frozen: wallet.frozen,
    frozenAt: wallet.frozenAt,
    frozenReason: wallet.frozenReason,
    lastTransactionAt: wallet.lastTransactionAt,
    $inc: { version: 1 },
  };
  // wallet.version was already incremented in helper — persist absolute fields + bump again? 
  // Simpler: save with version match
  const filter = { _id: wallet._id, version: expectedVersion };
  const opts = { new: true };
  if (session) opts.session = session;

  const updated = await BuyerWallet.findOneAndUpdate(
    filter,
    {
      $set: {
        availableBalance: wallet.availableBalance,
        pendingBalance: wallet.pendingBalance,
        totalDeposited: wallet.totalDeposited,
        totalSpent: wallet.totalSpent,
        totalRefunded: wallet.totalRefunded,
        frozen: wallet.frozen,
        frozenAt: wallet.frozenAt,
        frozenReason: wallet.frozenReason,
        lastTransactionAt: wallet.lastTransactionAt,
        version: wallet.version,
      },
    },
    opts,
  );

  if (!updated) {
    throw new AppError('Wallet was modified concurrently — please retry', 409, {
      code: 'WALLET_CONFLICT',
    });
  }
  return updated;
}

async function recordTx(payload, session = null) {
  if (session) {
    const [doc] = await BuyerWalletTransaction.create([payload], { session });
    return doc;
  }
  return BuyerWalletTransaction.create(payload);
}

export async function getMyWallet(actor) {
  const wallet = await getOrCreateBuyerWallet(actor.id);
  return serializeBuyerWallet(wallet);
}

export async function listHistory(actor, query = {}) {
  const pagination = parsePagination(query);
  const filter = { buyer: actor.id };
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.direction) filter.direction = query.direction;

  const [items, total] = await Promise.all([
    BuyerWalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    BuyerWalletTransaction.countDocuments(filter),
  ]);

  return {
    items: items.map(serializeTx),
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export function serializeTx(tx) {
  const doc = typeof tx.toObject === 'function' ? tx.toObject() : tx;
  return {
    id: doc._id,
    type: doc.type,
    direction: doc.direction,
    amount: roundMoney(doc.amount || 0),
    currency: doc.currency || 'USD',
    status: doc.status,
    balanceAfter: doc.balanceAfter == null ? null : roundMoney(doc.balanceAfter),
    pendingAfter: doc.pendingAfter == null ? null : roundMoney(doc.pendingAfter),
    reference: doc.reference || null,
    description: doc.description || '',
    deposit: doc.deposit || null,
    order: doc.order || null,
    payment: doc.payment || null,
    refund: doc.refund || null,
    meta: doc.meta || {},
    createdAt: doc.createdAt,
  };
}

/**
 * Create Cryptomus invoice for deposit or top-up.
 */
export async function createDepositOrTopup(payload, actor, purpose = 'deposit') {
  const amount = roundMoney(payload.amount);
  const { min, max } = depositLimits();
  if (!(amount >= min && amount <= max)) {
    throw new AppError(`Amount must be between $${min} and $${max}`, 400, {
      code: 'INVALID_DEPOSIT_AMOUNT',
      details: { min, max },
    });
  }

  const wallet = await getOrCreateBuyerWallet(actor.id);
  if (wallet.frozen) {
    throw new AppError('Wallet is frozen. Contact support.', 403, { code: 'WALLET_FROZEN' });
  }

  const depositNumber = generateDepositNumber(purpose);
  const cryptomusOrderId = `wal_${depositNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const lifetimeSeconds = 3600;
  const expiresAt = new Date(Date.now() + lifetimeSeconds * 1000);

  const deposit = await WalletDeposit.create({
    depositNumber,
    buyer: actor.id,
    buyerWallet: wallet._id,
    purpose,
    gateway: 'cryptomus',
    amount,
    currency: 'USD',
    toCurrency: payload.toCurrency || null,
    network: payload.network || null,
    status: PAYMENT_STATUS.PENDING,
    cryptomusOrderId,
    lifetimeSeconds,
    expiresAt,
    providerStatus: 'created',
  });

  // Pending tracking on wallet
  creditPending(wallet, amount);
  await saveWalletOptimistic(wallet);

  await recordTx({
    buyer: actor.id,
    buyerWallet: wallet._id,
    type: purpose === 'topup' ? BUYER_WALLET_TX_TYPE.TOPUP : BUYER_WALLET_TX_TYPE.DEPOSIT,
    direction: 'credit',
    amount,
    status: BUYER_WALLET_TX_STATUS.PENDING,
    balanceAfter: wallet.availableBalance,
    pendingAfter: wallet.pendingBalance,
    reference: depositNumber,
    description: purpose === 'topup' ? 'Wallet top-up pending Cryptomus payment' : 'Wallet deposit pending Cryptomus payment',
    deposit: deposit._id,
  });

  const callbackUrl = cryptomusService.buildCallbackUrl();
  const successBase = payload.urlSuccess || `${env.FRONTEND_URL}/wallet`;
  const urlSuccess = `${successBase}${successBase.includes('?') ? '&' : '?'}deposit=${encodeURIComponent(depositNumber)}`;

  let invoice;
  let simulated = false;
  try {
    const created = await cryptomusService.createInvoiceOrSimulate({
      amount,
      currency: 'USD',
      orderId: cryptomusOrderId,
      network: payload.network || null,
      toCurrency: payload.toCurrency || null,
      lifetime: lifetimeSeconds,
      urlCallback: callbackUrl,
      urlReturn: payload.urlReturn || `${env.FRONTEND_URL}/wallet`,
      urlSuccess,
      additionalData: `wallet_deposit:${deposit._id}`,
    });
    invoice = created.invoice;
    simulated = created.simulated;
  } catch (error) {
    deposit.status = PAYMENT_STATUS.FAILED;
    deposit.failureReason = error.message;
    deposit.isFinal = true;
    await deposit.save();
    try {
      const freshWallet = await getOrCreateBuyerWallet(actor.id);
      if ((freshWallet.pendingBalance || 0) + 1e-9 >= amount) {
        freshWallet.pendingBalance = roundMoney((freshWallet.pendingBalance || 0) - amount);
        freshWallet.version = (freshWallet.version || 0) + 1;
        await saveWalletOptimistic(freshWallet);
      }
      await BuyerWalletTransaction.updateMany(
        { deposit: deposit._id, status: BUYER_WALLET_TX_STATUS.PENDING },
        { $set: { status: BUYER_WALLET_TX_STATUS.FAILED } },
      );
    } catch {
      // best-effort cleanup
    }
    throw error;
  }

  deposit.cryptomusUuid = invoice.uuid || null;
  deposit.invoiceUrl = invoice.url || null;
  deposit.address = invoice.address || null;
  deposit.providerStatus = invoice.payment_status || 'check';
  deposit.rawInvoice = invoice;
  deposit.metadata = { ...(deposit.metadata || {}), simulated };
  await deposit.save();

  emitDomainEvent(DOMAIN_EVENTS.BUYER_WALLET_DEPOSIT_PENDING, {
    deposit: deposit.toObject(),
    buyerId: actor.id,
    purpose,
  });

  return {
    deposit: deposit.toObject(),
    wallet: serializeBuyerWallet(await getOrCreateBuyerWallet(actor.id)),
    paymentUrl: invoice.url,
    cryptomus: {
      uuid: invoice.uuid,
      orderId: cryptomusOrderId,
      simulated,
      mode: cryptomusService.getCryptomusMode(),
    },
  };
}

/**
 * Idempotent credit after Cryptomus confirms a wallet deposit/top-up.
 */
export async function applyDepositPaid(deposit, { providerStatus, raw = null, txid = null, session = null } = {}) {
  const fresh = session
    ? await WalletDeposit.findById(deposit._id).session(session)
    : await WalletDeposit.findById(deposit._id);
  if (!fresh) {
    throw new AppError('Deposit not found', 404, { code: 'DEPOSIT_NOT_FOUND' });
  }

  const mapped = cryptomusService.mapCryptomusStatusToPaymentStatus(providerStatus);
  fresh.providerStatus = providerStatus;
  if (raw) fresh.rawLastWebhook = raw;
  if (txid) fresh.txid = txid;
  if (raw?.address) fresh.address = raw.address;

  if (fresh.status === PAYMENT_STATUS.PAID && fresh.creditedAt) {
    if (session) await fresh.save({ session });
    else await fresh.save();
    return { deposit: fresh, alreadyCredited: true };
  }

  if (mapped === PAYMENT_STATUS.FAILED || mapped === PAYMENT_STATUS.EXPIRED || mapped === PAYMENT_STATUS.CANCELLED) {
    if (fresh.status === PAYMENT_STATUS.PENDING || fresh.status === PAYMENT_STATUS.PROCESSING) {
      fresh.status = mapped;
      fresh.isFinal = true;
      if (session) await fresh.save({ session });
      else await fresh.save();

      // Release pending hold
      const wallet = session
        ? await BuyerWallet.findById(fresh.buyerWallet).session(session)
        : await BuyerWallet.findById(fresh.buyerWallet);
      if (wallet && (wallet.pendingBalance || 0) >= fresh.amount - 1e-9) {
        wallet.pendingBalance = roundMoney((wallet.pendingBalance || 0) - fresh.amount);
        wallet.version = (wallet.version || 0) + 1;
        await saveWalletOptimistic(wallet, session);
      }
      await BuyerWalletTransaction.updateMany(
        { deposit: fresh._id, status: BUYER_WALLET_TX_STATUS.PENDING },
        { $set: { status: BUYER_WALLET_TX_STATUS.FAILED } },
        session ? { session } : undefined,
      );
    } else if (session) await fresh.save({ session });
    else await fresh.save();
    return { deposit: fresh, alreadyCredited: false };
  }

  if (mapped === PAYMENT_STATUS.PROCESSING) {
    fresh.status = PAYMENT_STATUS.PROCESSING;
    if (session) await fresh.save({ session });
    else await fresh.save();
    return { deposit: fresh, alreadyCredited: false };
  }

  if (mapped !== PAYMENT_STATUS.PAID) {
    if (session) await fresh.save({ session });
    else await fresh.save();
    return { deposit: fresh, alreadyCredited: false };
  }

  // PAID — credit available from pending (idempotent)
  const wallet = session
    ? await BuyerWallet.findById(fresh.buyerWallet).session(session)
    : await BuyerWallet.findById(fresh.buyerWallet);
  if (!wallet) {
    throw new AppError('Buyer wallet not found', 404, { code: 'BUYER_WALLET_NOT_FOUND' });
  }

  if ((wallet.pendingBalance || 0) + 1e-9 >= fresh.amount) {
    releasePendingToAvailable(wallet, fresh.amount);
  } else {
    // Pending already cleared somehow — credit available directly once
    creditAvailable(wallet, fresh.amount);
  }
  await saveWalletOptimistic(wallet, session);

  await ledgerService.recordTransfer({
    session,
    createdBy: null,
    context: {
      buyer: fresh.buyer,
      buyerWallet: wallet._id,
      deposit: fresh._id,
      currency: fresh.currency,
    },
    lines: [
      {
        direction: LEDGER_DIRECTION.DEBIT,
        account: LEDGER_ACCOUNT.EXTERNAL_GATEWAY,
        amount: fresh.amount,
        entryType: fresh.purpose === 'topup' ? LEDGER_ENTRY_TYPE.BUYER_TOPUP : LEDGER_ENTRY_TYPE.BUYER_DEPOSIT,
        description: 'Cryptomus wallet funding received',
      },
      {
        direction: LEDGER_DIRECTION.CREDIT,
        account: LEDGER_ACCOUNT.BUYER_AVAILABLE,
        amount: fresh.amount,
        entryType: fresh.purpose === 'topup' ? LEDGER_ENTRY_TYPE.BUYER_TOPUP : LEDGER_ENTRY_TYPE.BUYER_DEPOSIT,
        balanceAfter: wallet.availableBalance,
        description: fresh.purpose === 'topup' ? 'Buyer wallet top-up credited' : 'Buyer wallet deposit credited',
      },
    ],
  });

  const tx = await recordTx({
    buyer: fresh.buyer,
    buyerWallet: wallet._id,
    type: fresh.purpose === 'topup' ? BUYER_WALLET_TX_TYPE.TOPUP : BUYER_WALLET_TX_TYPE.DEPOSIT,
    direction: 'credit',
    amount: fresh.amount,
    status: BUYER_WALLET_TX_STATUS.COMPLETED,
    balanceAfter: wallet.availableBalance,
    pendingAfter: wallet.pendingBalance,
    reference: fresh.depositNumber,
    description: fresh.purpose === 'topup' ? 'Wallet top-up via Cryptomus' : 'Wallet deposit via Cryptomus',
    deposit: fresh._id,
  }, session);

  // Mark pending tx completed
  await BuyerWalletTransaction.updateMany(
    { deposit: fresh._id, status: BUYER_WALLET_TX_STATUS.PENDING },
    { $set: { status: BUYER_WALLET_TX_STATUS.COMPLETED, balanceAfter: wallet.availableBalance, pendingAfter: wallet.pendingBalance } },
    session ? { session } : undefined,
  );

  fresh.status = PAYMENT_STATUS.PAID;
  fresh.paidAt = fresh.paidAt || new Date();
  fresh.creditedAt = new Date();
  fresh.creditTransaction = tx._id;
  fresh.isFinal = true;
  if (session) await fresh.save({ session });
  else await fresh.save();

  emitDomainEvent(DOMAIN_EVENTS.BUYER_WALLET_CREDITED, {
    buyerId: String(fresh.buyer),
    amount: fresh.amount,
    purpose: fresh.purpose,
    deposit: fresh.toObject ? fresh.toObject() : fresh,
    wallet: serializeBuyerWallet(wallet),
  });

  return { deposit: fresh, alreadyCredited: false, transaction: tx };
}

/**
 * Spend buyer wallet for an order (atomic).
 */
export async function spendForOrder({
  buyerId,
  amount,
  orderId,
  paymentId,
  session,
  createdBy = null,
  description = 'Purchase paid from wallet',
}) {
  const value = roundMoney(amount);
  const wallet = session
    ? await BuyerWallet.findOne({ buyer: buyerId }).session(session)
    : await BuyerWallet.findOne({ buyer: buyerId });
  if (!wallet) {
    throw new AppError('Buyer wallet not found', 404, { code: 'BUYER_WALLET_NOT_FOUND' });
  }
  if (wallet.frozen) {
    throw new AppError('Wallet is frozen', 403, { code: 'WALLET_FROZEN' });
  }
  try {
    debitAvailable(wallet, value);
  } catch (error) {
    throw new AppError(error.message || 'Insufficient wallet balance', 400, {
      code: 'INSUFFICIENT_WALLET_BALANCE',
      details: {
        availableBalance: wallet.availableBalance,
        required: value,
      },
    });
  }
  await saveWalletOptimistic(wallet, session);

  // Ledger BUYER_AVAILABLE → ESCROW is recorded by wallet-aware escrow lock
  // (recordBuyerPaymentIntoEscrow with source=wallet) to avoid double-entry.

  const tx = await recordTx({
    buyer: buyerId,
    buyerWallet: wallet._id,
    type: BUYER_WALLET_TX_TYPE.PURCHASE,
    direction: 'debit',
    amount: value,
    status: BUYER_WALLET_TX_STATUS.COMPLETED,
    balanceAfter: wallet.availableBalance,
    pendingAfter: wallet.pendingBalance,
    reference: generateTransferId('purchase'),
    description,
    order: orderId,
    payment: paymentId,
    createdBy,
    meta: { ledgerViaEscrowLock: true },
  }, session);

  emitDomainEvent(DOMAIN_EVENTS.BUYER_WALLET_DEBITED, {
    buyerId: String(buyerId),
    amount: value,
    reason: 'purchase',
    orderId,
    wallet: serializeBuyerWallet(wallet),
  });

  return { wallet, transaction: tx };
}

/**
 * Credit buyer wallet for refund settlement (ledger already moved to BUYER_AVAILABLE).
 */
export async function creditRefundToWallet({
  buyerId,
  amount,
  orderId = null,
  paymentId = null,
  refundId = null,
  session = null,
  createdBy = null,
  description = 'Refund credited to wallet',
}) {
  const value = roundMoney(amount);
  let wallet = await getOrCreateBuyerWallet(buyerId, session);
  creditRefund(wallet, value);
  wallet = await saveWalletOptimistic(wallet, session);

  const tx = await recordTx({
    buyer: buyerId,
    buyerWallet: wallet._id,
    type: BUYER_WALLET_TX_TYPE.REFUND,
    direction: 'credit',
    amount: value,
    status: BUYER_WALLET_TX_STATUS.COMPLETED,
    balanceAfter: wallet.availableBalance,
    pendingAfter: wallet.pendingBalance,
    reference: generateTransferId('refund'),
    description,
    order: orderId,
    payment: paymentId,
    refund: refundId,
    createdBy,
  }, session);

  emitDomainEvent(DOMAIN_EVENTS.BUYER_WALLET_CREDITED, {
    buyerId: String(buyerId),
    amount: value,
    purpose: 'refund',
    wallet: serializeBuyerWallet(wallet),
  });

  return { wallet, transaction: tx };
}

export async function adminAdjustBuyerWallet(payload, actor) {
  const amount = roundMoney(payload.amount);
  if (!(amount > 0)) {
    throw new AppError('Amount must be positive', 400, { code: 'INVALID_AMOUNT' });
  }
  if (!['credit', 'debit'].includes(payload.direction)) {
    throw new AppError('Direction must be credit or debit', 400, { code: 'INVALID_DIRECTION' });
  }

  return withTransaction(async (session) => {
    const user = await User.findById(payload.buyerId).session(session);
    if (!user) throw new AppError('Buyer not found', 404, { code: 'BUYER_NOT_FOUND' });

    let wallet = await getOrCreateBuyerWallet(payload.buyerId, session);
    try {
      applyAdjustment(wallet, amount, payload.direction);
    } catch (error) {
      throw new AppError(error.message, 400, { code: 'ADJUSTMENT_FAILED' });
    }
    wallet = await saveWalletOptimistic(wallet, session);

    await ledgerService.recordTransfer({
      session,
      createdBy: actor.id,
      context: {
        buyer: payload.buyerId,
        buyerWallet: wallet._id,
        currency: wallet.currency,
      },
      lines: payload.direction === 'credit'
        ? [
          {
            direction: LEDGER_DIRECTION.DEBIT,
            account: LEDGER_ACCOUNT.PLATFORM_ADJUSTMENT,
            amount,
            entryType: LEDGER_ENTRY_TYPE.BUYER_ADJUSTMENT,
            description: payload.reason || 'Admin credit',
          },
          {
            direction: LEDGER_DIRECTION.CREDIT,
            account: LEDGER_ACCOUNT.BUYER_AVAILABLE,
            amount,
            entryType: LEDGER_ENTRY_TYPE.BUYER_ADJUSTMENT,
            balanceAfter: wallet.availableBalance,
            description: payload.reason || 'Admin credit to buyer wallet',
          },
        ]
        : [
          {
            direction: LEDGER_DIRECTION.DEBIT,
            account: LEDGER_ACCOUNT.BUYER_AVAILABLE,
            amount,
            entryType: LEDGER_ENTRY_TYPE.BUYER_ADJUSTMENT,
            balanceAfter: wallet.availableBalance,
            description: payload.reason || 'Admin debit from buyer wallet',
          },
          {
            direction: LEDGER_DIRECTION.CREDIT,
            account: LEDGER_ACCOUNT.PLATFORM_ADJUSTMENT,
            amount,
            entryType: LEDGER_ENTRY_TYPE.BUYER_ADJUSTMENT,
            description: payload.reason || 'Admin debit',
          },
        ],
    });

    const tx = await recordTx({
      buyer: payload.buyerId,
      buyerWallet: wallet._id,
      type: payload.type === 'bonus' ? BUYER_WALLET_TX_TYPE.BONUS : BUYER_WALLET_TX_TYPE.ADJUSTMENT,
      direction: payload.direction,
      amount,
      status: BUYER_WALLET_TX_STATUS.COMPLETED,
      balanceAfter: wallet.availableBalance,
      pendingAfter: wallet.pendingBalance,
      reference: generateTransferId('adj'),
      description: payload.reason || `Admin ${payload.direction}`,
      createdBy: actor.id,
      meta: { adminAdjustment: true },
    }, session);

    await logActivity({
      userId: actor.id,
      action: 'buyer_wallet.adjust',
      resource: 'BuyerWallet',
      resourceId: wallet._id,
      meta: { amount, direction: payload.direction, buyerId: payload.buyerId },
      session,
    });

    emitDomainEvent(DOMAIN_EVENTS.BUYER_WALLET_CREDITED, {
      buyerId: String(payload.buyerId),
      amount,
      purpose: 'adjustment',
      direction: payload.direction,
      wallet: serializeBuyerWallet(wallet),
    });

    return { wallet: serializeBuyerWallet(wallet), transaction: serializeTx(tx) };
  });
}

export async function freezeBuyerWallet(buyerId, reason, actor) {
  const wallet = await getOrCreateBuyerWallet(buyerId);
  wallet.frozen = true;
  wallet.frozenAt = new Date();
  wallet.frozenReason = reason || 'Frozen by admin';
  wallet.version = (wallet.version || 0) + 1;
  await saveWalletOptimistic(wallet);
  emitDomainEvent(DOMAIN_EVENTS.BUYER_WALLET_FROZEN, {
    buyerId: String(buyerId),
    reason: wallet.frozenReason,
    actorId: actor?.id,
  });
  return serializeBuyerWallet(wallet);
}

export async function unfreezeBuyerWallet(buyerId, actor) {
  const wallet = await getOrCreateBuyerWallet(buyerId);
  wallet.frozen = false;
  wallet.frozenAt = null;
  wallet.frozenReason = null;
  wallet.version = (wallet.version || 0) + 1;
  await saveWalletOptimistic(wallet);
  emitDomainEvent(DOMAIN_EVENTS.BUYER_WALLET_UNFROZEN, {
    buyerId: String(buyerId),
    actorId: actor?.id,
  });
  return serializeBuyerWallet(wallet);
}

export async function adminGetBuyerWallet(buyerId) {
  const user = await User.findById(buyerId).select('email name roles status').lean();
  if (!user) throw new AppError('Buyer not found', 404, { code: 'BUYER_NOT_FOUND' });
  const wallet = await getOrCreateBuyerWallet(buyerId);
  return { user, wallet: serializeBuyerWallet(wallet) };
}

export async function adminListTransactions(query = {}) {
  const pagination = parsePagination(query);
  const filter = {};
  if (query.buyerId) filter.buyer = query.buyerId;
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.direction) filter.direction = query.direction;
  if (query.q) {
    filter.$or = [
      { reference: new RegExp(String(query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { description: new RegExp(String(query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    BuyerWalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('buyer', 'email name')
      .lean(),
    BuyerWalletTransaction.countDocuments(filter),
  ]);

  return {
    items: items.map((tx) => ({
      ...serializeTx(tx),
      buyerEmail: tx.buyer?.email || null,
      buyerName: tx.buyer?.name || null,
      buyerId: tx.buyer?._id || tx.buyer,
    })),
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export async function exportTransactionsCsv(query = {}) {
  const { items } = await adminListTransactions({ ...query, page: 1, limit: 5000 });
  const header = [
    'id', 'date', 'buyerId', 'buyerEmail', 'type', 'direction', 'amount', 'currency',
    'status', 'balanceAfter', 'reference', 'description',
  ];
  const rows = items.map((tx) => [
    tx.id,
    tx.createdAt ? new Date(tx.createdAt).toISOString() : '',
    tx.buyerId,
    tx.buyerEmail || '',
    tx.type,
    tx.direction,
    tx.amount,
    tx.currency,
    tx.status,
    tx.balanceAfter ?? '',
    tx.reference || '',
    `"${String(tx.description || '').replace(/"/g, '""')}"`,
  ].join(','));
  return `${header.join(',')}\n${rows.join('\n')}\n`;
}

export async function findDepositByCryptomus(uuid, orderId, session = null) {
  let deposit = null;
  if (uuid) {
    const q = WalletDeposit.findOne({ cryptomusUuid: uuid });
    if (session) q.session(session);
    deposit = await q;
  }
  if (!deposit && orderId) {
    const q = WalletDeposit.findOne({ cryptomusOrderId: orderId });
    if (session) q.session(session);
    deposit = await q;
  }
  return deposit;
}

export default {
  getOrCreateBuyerWallet,
  getMyWallet,
  listHistory,
  createDepositOrTopup,
  applyDepositPaid,
  spendForOrder,
  creditRefundToWallet,
  adminAdjustBuyerWallet,
  freezeBuyerWallet,
  unfreezeBuyerWallet,
  adminGetBuyerWallet,
  adminListTransactions,
  exportTransactionsCsv,
  findDepositByCryptomus,
  serializeBuyerWallet,
  depositLimits,
};
