import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectBlockedContent,
  detectOcrSensitiveContent,
  validateChatAttachment,
  normalizeForDetection,
} from '../../src/helpers/contentFilter.helper.js';

test('blocks phone numbers in common formats', () => {
  for (const sample of [
    '+923001234567',
    '923001234567',
    '03001234567',
    'my number is 03001234567',
  ]) {
    const result = detectBlockedContent(sample);
    assert.equal(result.blocked, true, sample);
    assert.ok(result.rules.includes('phone'), sample);
  }
});

test('blocks WhatsApp / Telegram / Discord links', () => {
  assert.ok(detectBlockedContent('wa.me/923001234567').blocked);
  assert.ok(detectBlockedContent('chat.whatsapp.com/invite').blocked);
  assert.ok(detectBlockedContent('t.me/username').blocked);
  assert.ok(detectBlockedContent('telegram.me/user').blocked);
  assert.ok(detectBlockedContent('discord.gg/abc').blocked);
  assert.ok(detectBlockedContent('discord.com/invite/abc').blocked);
});

test('blocks social profile links and emails', () => {
  assert.ok(detectBlockedContent('instagram.com/username').blocked);
  assert.ok(detectBlockedContent('facebook.com/profile').blocked);
  assert.ok(detectBlockedContent('twitter.com/user').blocked);
  assert.ok(detectBlockedContent('x.com/user').blocked);
  assert.ok(detectBlockedContent('contact me at amankhan@gmail.com').blocked);
  assert.ok(detectBlockedContent('name@hotmail.com').blocked);
  assert.ok(detectBlockedContent('user@proton.me').blocked);
});

test('allows digital-account status discussion without profile links', () => {
  assert.equal(
    detectBlockedContent('The Instagram account is disabled and Facebook shows a checkpoint.').blocked,
    false,
  );
  assert.equal(
    detectBlockedContent('Gmail security warning appeared after login failed.').blocked,
    false,
  );
});

test('blocks URLs and wallet keywords', () => {
  assert.ok(detectBlockedContent('https://evil.example/path').blocked);
  assert.ok(detectBlockedContent('http://example.com').blocked);
  assert.ok(detectBlockedContent('www.example.com').blocked);
  assert.ok(detectBlockedContent('send USDT to my metamask').blocked);
  assert.ok(detectBlockedContent('binance UID 12345').blocked);
});

test('detects obfuscated platforms and spoken digits', () => {
  assert.ok(detectBlockedContent('w h a t s a p p').blocked);
  assert.ok(detectBlockedContent('w.h.a.t.s.a.p.p').blocked);
  assert.ok(detectBlockedContent('tele gram').blocked);
  assert.ok(detectBlockedContent('tg: myuser').blocked);
  assert.ok(detectBlockedContent('my number is nine two three zero zero one two three four five six seven').blocked);
  assert.ok(detectBlockedContent('email me at aman @ gmail . com').blocked);
});

test('allows normal dispute language', () => {
  const clean = detectBlockedContent(
    'The license key did not activate. Please help resolve this order.',
  );
  assert.equal(clean.blocked, false);
});

test('attachment allowlist and executable rejection', () => {
  assert.equal(validateChatAttachment('https://cdn.example.com/a.png').ok, true);
  assert.equal(validateChatAttachment('https://cdn.example.com/a.PDF').ok, true);
  assert.equal(validateChatAttachment('https://cdn.example.com/a.zip').ok, true);
  assert.equal(validateChatAttachment('https://cdn.example.com/a.txt').ok, true);
  assert.equal(validateChatAttachment('https://cdn.example.com/a.exe').ok, false);
  assert.equal(validateChatAttachment('malware.pdf.exe').ok, false);
  assert.equal(validateChatAttachment('script.js').ok, false);
});

test('normalize collapses obfuscation', () => {
  const { collapsed } = normalizeForDetection('W.h.a.t.s.a.p.p');
  assert.equal(collapsed.includes('whatsapp'), true);
});

test('OCR scan allows account UI wording but flags contact payloads', () => {
  const ui = detectOcrSensitiveContent(
    'Login failed. Wrong password. Facebook checkpoint. Gmail security warning. cPanel dashboard.',
  );
  assert.equal(ui.sensitive, false);

  const contact = detectOcrSensitiveContent(
    'WhatsApp me at +923001234567 or recovery@gmail.com https://t.me/seller',
  );
  assert.equal(contact.sensitive, true);
  assert.ok(contact.rules.includes('phone') || contact.rules.includes('email'));
});
