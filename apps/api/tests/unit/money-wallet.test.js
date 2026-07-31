import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCommission, roundMoney } from '../../src/helpers/money.helper.js';
import {
  computeWithdrawable,
  isCoinNetworkCompatible,
  validateWalletAddress,
  reserveWithdrawal,
  applyWalletCredit,
  applyPendingCredit,
} from '../../src/helpers/wallet.helper.js';

test('default 10% commission split is correct', () => {
  const split = calculateCommission(100, 10);
  assert.equal(split.commissionAmount, 10);
  assert.equal(split.sellerAmount, 90);
});

test('roundMoney stabilizes floats', () => {
  assert.equal(roundMoney(10.005), 10.01);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
});

test('coin/network compatibility', () => {
  assert.equal(isCoinNetworkCompatible('USDT', 'TRC20'), true);
  assert.equal(isCoinNetworkCompatible('BTC', 'ERC20'), false);
});

test('wallet address validation', () => {
  assert.equal(validateWalletAddress('ERC20', '0x1234567890123456789012345678901234567890').valid, true);
  assert.equal(validateWalletAddress('TRC20', 'TXYZ').valid, false);
});

test('wallet reserve and credit helpers', () => {
  const wallet = {
    availableBalance: 100,
    pendingBalance: 0,
    reservedBalance: 0,
    releasedBalance: 0,
    withdrawableBalance: 100,
    version: 0,
  };

  applyPendingCredit(wallet, 50);
  assert.equal(wallet.pendingBalance, 50);

  applyWalletCredit(wallet, 40);
  assert.equal(wallet.availableBalance, 140);
  assert.equal(wallet.releasedBalance, 40);

  reserveWithdrawal(wallet, 25);
  assert.equal(wallet.availableBalance, 115);
  assert.equal(wallet.reservedBalance, 25);
  // withdrawable = available - reserved
  assert.equal(computeWithdrawable(wallet.availableBalance, wallet.reservedBalance), 90);
});
