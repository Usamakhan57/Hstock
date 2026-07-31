import test from 'node:test';
import assert from 'node:assert/strict';
import {
  signCryptomusPayload,
  verifyCryptomusSignature,
  sha256Hex,
} from '../../src/utils/crypto.js';

test('cryptomus signature is deterministic and verifiable', () => {
  const apiKey = 'test-api-key-secret';
  const webhookBodyWithoutSign = {
    amount: '15.00',
    currency: 'USD',
    order_id: 'pay_ORD_123',
    status: 'paid',
  };

  const sign = signCryptomusPayload(webhookBodyWithoutSign, apiKey);
  assert.equal(typeof sign, 'string');
  assert.equal(sign.length, 32);

  const webhookBody = { ...webhookBodyWithoutSign, sign };
  assert.equal(verifyCryptomusSignature(webhookBody, apiKey, sign), true);
  assert.equal(
    verifyCryptomusSignature(webhookBody, apiKey, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    false,
  );
});

test('sha256Hex returns 64 hex chars', () => {
  const hash = sha256Hex('hello');
  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]+$/);
});
