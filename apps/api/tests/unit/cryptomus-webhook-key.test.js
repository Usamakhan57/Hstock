import '../helpers/env-bootstrap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWebhookEventKey } from '../../src/services/cryptomus.service.js';

test('webhook event key ignores signature so retries dedupe', () => {
  const base = {
    uuid: 'pay-uuid-1',
    order_id: 'pay_ORD_1',
    status: 'paid',
    payment_status: 'paid',
    txid: 'chain-tx-1',
  };

  const keyA = buildWebhookEventKey({ ...base, sign: 'signature-one' });
  const keyB = buildWebhookEventKey({ ...base, sign: 'signature-two' });
  const keyC = buildWebhookEventKey({ ...base, status: 'wrong_amount', sign: 'signature-one' });

  assert.equal(keyA, keyB);
  assert.notEqual(keyA, keyC);
});
