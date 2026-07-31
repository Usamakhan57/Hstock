/**
 * Anti off-platform content filter for dispute chat.
 * Detects contact info, social handles, URLs, wallets, and obfuscated variants.
 */

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060\u180E]/g;
const NON_ALNUM_BETWEEN_LETTERS = /(?<=\p{L})\W+(?=\p{L})/gu;

const DIGIT_WORDS = Object.freeze({
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  oh: '0',
  o: '0',
});

const PLATFORM_KEYWORDS = [
  { rule: 'whatsapp', patterns: [/whatsapp/i, /\bwa\.me\b/i, /chat\.whatsapp\.com/i, /\bwa\b[\s.]*me\b/i] },
  { rule: 'telegram', patterns: [/\btelegram\b/i, /\bt\.me\b/i, /telegram\.me/i, /\btg\s*:/i, /\btele\s*gram\b/i] },
  { rule: 'discord', patterns: [/\bdiscord\b/i, /discord\.gg/i, /discord\.com\/invite/i] },
  { rule: 'instagram', patterns: [/\binstagram\b/i, /instagr\.am/i, /\binsta\b/i] },
  { rule: 'facebook', patterns: [/\bfacebook\b/i, /\bfb\.com\b/i, /facebook\.com\/profile/i] },
  { rule: 'tiktok', patterns: [/\btiktok\b/i, /vm\.tiktok\.com/i] },
  { rule: 'twitter', patterns: [/\btwitter\b/i, /\bx\.com\b/i] },
  { rule: 'snapchat', patterns: [/\bsnapchat\b/i, /\bsnap\s*chat\b/i] },
  { rule: 'skype', patterns: [/\bskype\b/i] },
  { rule: 'signal', patterns: [/\bsignal\b/i] },
  { rule: 'line', patterns: [/\bline\.me\b/i, /\bline\s*app\b/i] },
  { rule: 'wechat', patterns: [/\bwechat\b/i, /\bweixin\b/i] },
  { rule: 'qq', patterns: [/\bqq\.com\b/i, /\bqq\s*id\b/i] },
  { rule: 'email_provider', patterns: [
    /\bgmail\.com\b/i, /\bhotmail\.com\b/i, /\boutlook\.com\b/i,
    /\bproton\.me\b/i, /\bprotonmail\b/i, /\byahoo\.com\b/i, /\bicloud\.com\b/i,
  ] },
  { rule: 'external_marketplace', patterns: [
    /\bplayerauctions\b/i, /\bg2a\b/i, /\bkucoin\b/i, /\bfiverr\b/i,
    /\bupwork\b/i, /\bebay\b/i, /\bseller\s*outside\b/i,
  ] },
  { rule: 'off_platform_invite', patterns: [
    /contact\s+me\s+(on|via|outside)/i,
    /message\s+me\s+(on|via|outside)/i,
    /reach\s+me\s+(on|via|outside)/i,
    /talk\s+(on|via)\s+(whatsapp|telegram|discord|email)/i,
    /outside\s+hstock/i,
    /off[\s-]?platform/i,
  ] },
  { rule: 'qr_code', patterns: [/\bqr[\s-]?code\b/i, /\bscan\s+(my\s+)?qr\b/i] },
  { rule: 'wallet_keyword', patterns: [
    /\bmetamask\b/i, /\btrust\s*wallet\b/i, /\bbinance\s*uid\b/i,
    /\bbybit\s*uid\b/i, /\bokx\s*uid\b/i,
    /\busdt\b/i, /\bbtc\b/i, /\beth\b/i, /\btrx\b/i, /\bbnb\b/i, /\bsolana\b/i,
  ] },
];

/**
 * Collapse obfuscation: unicode, zero-width, spaced/dotted letters, digit words.
 */
export function normalizeForDetection(raw) {
  if (raw === undefined || raw === null) return '';
  let text = String(raw).normalize('NFKC');
  text = text.replace(ZERO_WIDTH, '');
  text = text.toLowerCase();

  // Convert spoken digits: "nine two three" → "923"
  text = text.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b(?:\s+\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b)+/g,
    (match) => match.split(/\s+/).map((w) => DIGIT_WORDS[w] || w).join(''),
  );

  // Collapsed form for keyword matching (w h a t s a p p → whatsapp)
  const collapsed = text
    .replace(NON_ALNUM_BETWEEN_LETTERS, '')
    .replace(/[^\p{L}\p{N}@.:/\s+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { originalLower: text, collapsed };
}

function pushRule(rules, rule) {
  if (!rules.includes(rule)) rules.push(rule);
}

/**
 * Scan message text for blocked contact / off-platform content.
 * @returns {{ blocked: boolean, rules: string[] }}
 */
export function detectBlockedContent(raw) {
  const rules = [];
  const { originalLower, collapsed } = normalizeForDetection(raw);
  if (!originalLower && !collapsed) {
    return { blocked: false, rules };
  }

  const haystacks = [originalLower, collapsed];

  for (const { rule, patterns } of PLATFORM_KEYWORDS) {
    for (const pattern of patterns) {
      if (haystacks.some((h) => pattern.test(h))) {
        pushRule(rules, rule);
        break;
      }
    }
  }

  // Email addresses (including spaced: a @ b . com / name @ gmail . com)
  const emailCollapsed = collapsed.replace(/\s+/g, '');
  if (
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(originalLower)
    || /[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i.test(originalLower)
    || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(emailCollapsed)
  ) {
    pushRule(rules, 'email');
  }

  // URLs / schemes / www
  if (
    /\bhttps?:\/\//i.test(originalLower)
    || /\bwww\./i.test(originalLower)
    || /\bhttps?\b/.test(collapsed)
    || /\bwww\./.test(collapsed)
  ) {
    pushRule(rules, 'url');
  }

  // Bare domain-like tokens (example.com/path)
  if (/(?:^|[\s(])[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/[\w./?%&=-]*)?/i.test(originalLower)) {
    pushRule(rules, 'url');
  }

  // Phone numbers: +92..., 03..., wa.me, dense digit runs 10-15
  const digitsOnly = originalLower.replace(/\D/g, '');
  if (
    /(?:\+|00)?\d{1,3}[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/.test(originalLower)
    || /(?:\+|00)?\d{10,15}/.test(digitsOnly)
    || /(?:my\s+)?(?:number|phone|mobile|whatsapp)\s*(?:is|:)?\s*\d/i.test(originalLower)
  ) {
    // Avoid flagging short order numbers alone — require 10+ digits or phone context
    if (digitsOnly.length >= 10 || /(?:number|phone|mobile|whatsapp|call|sms)/i.test(originalLower)) {
      pushRule(rules, 'phone');
    }
  }

  // Crypto addresses
  if (
    /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/.test(raw) // BTC legacy
    || /\bbc1[a-z0-9]{25,87}\b/i.test(originalLower) // bech32
    || /\b0x[a-f0-9]{40}\b/i.test(originalLower) // ETH
    || /\bT[1-9A-HJ-NP-Za-km-z]{33}\b/.test(raw) // TRX
    || /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/.test(raw) && /\b(sol|solana|wallet)\b/i.test(originalLower)
  ) {
    pushRule(rules, 'wallet_address');
  }

  // Social @handles when paired with platform words or standalone invite
  if (
    /(?:^|[\s])@[a-z0-9_.]{3,32}\b/i.test(originalLower)
    && /(?:instagram|tiktok|twitter|telegram|discord|snap|fb|facebook|handle|user\s*name|username|follow)/i.test(collapsed)
  ) {
    pushRule(rules, 'social_handle');
  }

  // Referral / invite links language
  if (/\b(referral|invite\s*link|ref\s*=|affiliate)\b/i.test(originalLower)) {
    pushRule(rules, 'referral');
  }

  return { blocked: rules.length > 0, rules };
}

/**
 * Validate attachment filename / URL against allowlist and executable denylist.
 * @returns {{ ok: boolean, reason?: string, extension?: string }}
 */
export function validateChatAttachment(resource) {
  if (!resource) return { ok: false, reason: 'empty_attachment' };
  const value = String(resource).trim();
  if (!value) return { ok: false, reason: 'empty_attachment' };

  let pathname = value;
  try {
    if (value.includes('://')) {
      pathname = new URL(value).pathname;
    }
  } catch {
    pathname = value.split('?')[0];
  }

  const base = pathname.split('/').pop() || pathname;
  const lower = base.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0) {
    return { ok: false, reason: 'missing_extension', extension: null };
  }
  const ext = lower.slice(dot + 1);

  const { DISPUTE_CHAT_ALLOWED_EXTENSIONS, DISPUTE_CHAT_BLOCKED_EXTENSIONS } = requireExtensions();

  if (DISPUTE_CHAT_BLOCKED_EXTENSIONS.includes(ext)) {
    return { ok: false, reason: 'executable_or_dangerous', extension: ext };
  }
  if (!DISPUTE_CHAT_ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, reason: 'extension_not_allowed', extension: ext };
  }

  // Suspicious double extensions: file.pdf.exe
  const parts = lower.split('.');
  if (parts.length > 2) {
    const inner = parts[parts.length - 2];
    if (DISPUTE_CHAT_BLOCKED_EXTENSIONS.includes(inner)) {
      return { ok: false, reason: 'double_extension', extension: ext };
    }
  }

  return { ok: true, extension: ext };
}

function requireExtensions() {
  // Lazy import to keep helper usable in unit tests without circular deps
  return {
    DISPUTE_CHAT_ALLOWED_EXTENSIONS: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'zip', 'txt',
    ],
    DISPUTE_CHAT_BLOCKED_EXTENSIONS: [
      'exe', 'bat', 'cmd', 'com', 'msi', 'dll', 'scr', 'ps1', 'sh', 'bash',
      'js', 'mjs', 'cjs', 'jar', 'apk', 'dmg', 'app', 'bin', 'vbs', 'wsf',
      'php', 'py', 'rb', 'pl', 'cgi', 'hta', 'iso', 'img',
    ],
  };
}

export default {
  normalizeForDetection,
  detectBlockedContent,
  validateChatAttachment,
};
