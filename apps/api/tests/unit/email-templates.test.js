import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../helpers/env-bootstrap.js';
import { buildEmailTemplate } from '../../src/emails/templates.js';

describe('email templates', () => {
  it('builds verification template', () => {
    const tpl = buildEmailTemplate('verification', {
      name: 'Ada',
      verifyUrl: 'https://example.com/verify',
    });
    assert.match(tpl.subject, /Verify/i);
    assert.match(tpl.html, /Ada/);
    assert.match(tpl.html, /https:\/\/example.com\/verify/);
    assert.ok(tpl.text);
  });

  it('builds payment_success template', () => {
    const tpl = buildEmailTemplate('payment_success', { orderNumber: 'HS-1' });
    assert.match(tpl.subject, /Payment successful/i);
    assert.match(tpl.html, /HS-1/);
  });

  it('falls back for unknown type', () => {
    const tpl = buildEmailTemplate('custom_type', { title: 'Hello', body: 'World' });
    assert.match(tpl.html, /Hello/);
    assert.match(tpl.html, /World/);
  });
});
