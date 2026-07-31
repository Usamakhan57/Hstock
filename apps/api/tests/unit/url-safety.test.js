import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../helpers/env-bootstrap.js';
import { assertSafeRemoteImageUrl } from '../../src/utils/urlSafety.js';

describe('urlSafety', () => {
  it('allows relative upload paths rewritten to APP_URL', async () => {
    const url = await assertSafeRemoteImageUrl('/uploads/products/a.png');
    assert.match(url, /\/uploads\/products\/a\.png$/);
  });

  it('rejects non-http protocols', async () => {
    await assert.rejects(
      () => assertSafeRemoteImageUrl('file:///etc/passwd'),
      /protocol|Invalid/i,
    );
  });

  it('rejects private IP literals', async () => {
    await assert.rejects(
      () => assertSafeRemoteImageUrl('http://127.0.0.1/secret.png'),
      /Private IP|not allowed/i,
    );
  });

  it('rejects link-local / metadata style hosts', async () => {
    await assert.rejects(
      () => assertSafeRemoteImageUrl('http://169.254.169.254/latest/meta-data'),
      /Private IP|not allowed|Blocked/i,
    );
  });
});
