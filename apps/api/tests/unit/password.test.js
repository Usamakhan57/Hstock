import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, comparePassword } from '../../src/utils/password.js';

test('password hashing and comparison', async () => {
  const hash = await hashPassword('Password123!');
  assert.notEqual(hash, 'Password123!');
  assert.equal(await comparePassword('Password123!', hash), true);
  assert.equal(await comparePassword('wrong', hash), false);
});
