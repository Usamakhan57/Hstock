import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  creditAvailable,
  debitAvailable,
  creditPending,
  releasePendingToAvailable,
  creditRefund,
  applyAdjustment,
} from '../../src/helpers/buyerWallet.helper.js';

test('buyer wallet credit / debit / pending release', () => {
  const wallet = {
    availableBalance: 0,
    pendingBalance: 0,
    totalDeposited: 0,
    totalSpent: 0,
    totalRefunded: 0,
    version: 0,
    frozen: false,
  };

  creditPending(wallet, 50);
  assert.equal(wallet.pendingBalance, 50);
  releasePendingToAvailable(wallet, 50);
  assert.equal(wallet.availableBalance, 50);
  assert.equal(wallet.pendingBalance, 0);

  debitAvailable(wallet, 20);
  assert.equal(wallet.availableBalance, 30);
  assert.equal(wallet.totalSpent, 20);

  creditRefund(wallet, 10);
  assert.equal(wallet.availableBalance, 40);
  assert.equal(wallet.totalRefunded, 10);

  applyAdjustment(wallet, 5, 'credit');
  assert.equal(wallet.availableBalance, 45);
  applyAdjustment(wallet, 5, 'debit');
  assert.equal(wallet.availableBalance, 40);
});

test('buyer wallet rejects negative and frozen spend', () => {
  const wallet = {
    availableBalance: 10,
    pendingBalance: 0,
    totalDeposited: 10,
    totalSpent: 0,
    totalRefunded: 0,
    version: 1,
    frozen: true,
  };
  assert.throws(() => debitAvailable(wallet, 5), /frozen/i);
  wallet.frozen = false;
  assert.throws(() => debitAvailable(wallet, 20), /Insufficient/i);
  assert.throws(() => creditAvailable(wallet, 0), /positive/i);
});
