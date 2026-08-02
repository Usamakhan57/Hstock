import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import '../helpers/env-bootstrap.js';
import {
  getMissingSmtpConfig,
  isSmtpConfigured,
  sendEmail,
} from '../../src/emails/email.service.js';
import { buildEmailTemplate } from '../../src/emails/templates.js';

describe('email service configuration helpers', () => {
  it('reports missing SMTP vars', () => {
    const missing = getMissingSmtpConfig({
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
    });
    assert.deepEqual(missing, ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']);
    assert.equal(isSmtpConfigured({
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
    }), false);
  });

  it('treats blank whitespace as missing', () => {
    const missing = getMissingSmtpConfig({
      SMTP_HOST: '   ',
      SMTP_USER: 'user@example.com',
      SMTP_PASS: 'secret',
    });
    assert.deepEqual(missing, ['SMTP_HOST']);
  });

  it('accepts a complete SMTP config', () => {
    assert.equal(isSmtpConfigured({
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'user@example.com',
      SMTP_PASS: 'secret',
    }), true);
  });
});

describe('sendEmail without SMTP in test', () => {
  it('logs instead of throwing when SMTP is unset (non-production)', async () => {
    const result = await sendEmail({
      to: 'buyer@example.com',
      subject: 'Test',
      text: 'hello',
      html: '<p>hello</p>',
    });
    assert.equal(result.sent, false);
    assert.equal(result.provider, 'log');
    assert.ok(Array.isArray(result.missing));
  });

  it('rejects invalid recipients', async () => {
    await assert.rejects(
      () => sendEmail({ to: 'not-an-email', subject: 'x', text: 'y' }),
      (err) => err.code === 'INVALID_EMAIL',
    );
  });
});

describe('password reset template', () => {
  it('includes reset URL and expiry copy', () => {
    const tpl = buildEmailTemplate('password_reset', {
      name: 'Sam',
      resetUrl: 'https://apnastore.org/reset-password?token=abc',
      expiresInMinutes: 60,
    });
    assert.match(tpl.subject, /Reset/i);
    assert.match(tpl.html, /Sam/);
    assert.match(tpl.html, /https:\/\/apnastore.org\/reset-password\?token=abc/);
    assert.match(tpl.html, /60 minutes/);
    assert.match(tpl.text, /token=abc/);
  });
});
