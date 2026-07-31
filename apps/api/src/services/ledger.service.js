import { AppError } from '../utils/AppError.js';
import { roundMoney } from '../helpers/money.helper.js';
import { generateTransferId } from '../helpers/id.helper.js';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import { LEDGER_DIRECTION } from '../constants/ledger.js';
import * as ledgerRepository from '../repositories/ledger.repository.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

/**
 * Record a balanced double-entry transfer.
 * @param {{
 *  lines: Array<{ direction: string, account: string, amount: number, entryType: string, balanceAfter?: number|null, description?: string, meta?: object }>,
 *  context?: object,
 *  transferId?: string,
 *  createdBy?: string|null,
 *  session?: import('mongoose').ClientSession|null
 * }} params
 */
export async function recordTransfer({
  lines,
  context = {},
  transferId = null,
  createdBy = null,
  session = null,
} = {}) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new AppError('Ledger transfer requires at least two lines', 500, {
      code: 'LEDGER_INVALID_TRANSFER',
    });
  }

  let debitTotal = 0;
  let creditTotal = 0;
  const tid = transferId || generateTransferId();

  const docs = lines.map((line) => {
    const amount = roundMoney(line.amount);
    if (!(amount > 0)) {
      throw new AppError('Ledger line amount must be positive', 500, {
        code: 'LEDGER_INVALID_AMOUNT',
      });
    }
    if (line.direction === LEDGER_DIRECTION.DEBIT) debitTotal = roundMoney(debitTotal + amount);
    else if (line.direction === LEDGER_DIRECTION.CREDIT) creditTotal = roundMoney(creditTotal + amount);
    else {
      throw new AppError('Invalid ledger direction', 500, { code: 'LEDGER_INVALID_DIRECTION' });
    }

    return {
      transferId: tid,
      entryType: line.entryType,
      direction: line.direction,
      account: line.account,
      amount,
      currency: context.currency || LEDGER_CURRENCY,
      balanceAfter: line.balanceAfter ?? null,
      order: context.order || null,
      payment: context.payment || null,
      escrow: context.escrow || null,
      withdrawal: context.withdrawal || null,
      refund: context.refund || null,
      dispute: context.dispute || null,
      seller: context.seller || null,
      sellerUser: context.sellerUser || null,
      buyer: context.buyer || null,
      wallet: context.wallet || null,
      description: line.description || '',
      createdBy,
      meta: line.meta || {},
    };
  });

  if (debitTotal !== creditTotal) {
    throw new AppError('Ledger transfer is unbalanced', 500, {
      code: 'LEDGER_UNBALANCED',
      details: { debitTotal, creditTotal, transferId: tid },
    });
  }

  const created = await ledgerRepository.createLedgerEntries(docs, session);
  return { transferId: tid, entries: created, debitTotal, creditTotal };
}

export async function listLedger({
  sellerId = null,
  buyerId = null,
  orderId = null,
  walletId = null,
  transferId = null,
  page,
  limit,
} = {}) {
  const pagination = parsePagination({ page, limit }, { page: 1, limit: 50, maxLimit: 100 });
  const filter = {};
  if (sellerId) filter.seller = sellerId;
  if (buyerId) filter.buyer = buyerId;
  if (orderId) filter.order = orderId;
  if (walletId) filter.wallet = walletId;
  if (transferId) filter.transferId = transferId;

  const { items, total } = await ledgerRepository.listLedgerEntries(filter, pagination);
  return {
    items,
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export default {
  recordTransfer,
  listLedger,
};
