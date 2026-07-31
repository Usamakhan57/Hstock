import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptCredential,
  decryptCredential,
  maskCredential,
  encryptSensitiveObject,
  decryptSensitiveObject,
  redactForLogs,
} from '../../src/utils/credentials.crypto.js';

test('encrypt/decrypt round-trip for credentials', () => {
  const plain = 'SuperSecretPass!234';
  const enc = encryptCredential(plain);
  assert.ok(enc.startsWith('v1.'));
  assert.notEqual(enc, plain);
  assert.equal(decryptCredential(enc), plain);
});

test('maskCredential hides sensitive values', () => {
  assert.equal(maskCredential('ab'), '****');
  assert.ok(maskCredential('password123').startsWith('pa'));
  assert.ok(maskCredential('password123').includes('*'));
});

test('encryptSensitiveObject masks and encrypts fields', () => {
  const { encrypted, masked } = encryptSensitiveObject({
    username: 'buyer1',
    email: 'acct@example.com',
    password: 'P@ssw0rd',
    otp: '123456',
    apiKey: 'sk_live_abc',
  });
  assert.ok(encrypted.password.startsWith('v1.'));
  assert.ok(masked.password.includes('*'));
  assert.notEqual(masked.password, 'P@ssw0rd');

  const revealed = decryptSensitiveObject(encrypted);
  assert.equal(revealed.username, 'buyer1');
  assert.equal(revealed.password, 'P@ssw0rd');
  assert.equal(revealed.otp, '123456');
});

test('redactForLogs strips secrets', () => {
  const redacted = redactForLogs({
    password: 'secret',
    nested: { apiKey: 'x', note: 'ok' },
  });
  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.nested.apiKey, '[REDACTED]');
  assert.equal(redacted.nested.note, 'ok');
});
