export const DISPUTE_CHAT_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
});

export const DISPUTE_CHAT_STATUS_VALUES = Object.freeze(Object.values(DISPUTE_CHAT_STATUS));

export const DISPUTE_CHAT_MESSAGE_STATUS = Object.freeze({
  VISIBLE: 'visible',
  DELETED: 'deleted',
});

export const DISPUTE_CHAT_MESSAGE_STATUS_VALUES = Object.freeze(
  Object.values(DISPUTE_CHAT_MESSAGE_STATUS),
);

export const DISPUTE_CHAT_ROLES = Object.freeze({
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SYSTEM: 'system',
});

export const DISPUTE_CHAT_ROLE_VALUES = Object.freeze(Object.values(DISPUTE_CHAT_ROLES));

export const DISPUTE_CHAT_AUDIT_ACTIONS = Object.freeze({
  CHAT_CREATED: 'chat_created',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_BLOCKED: 'message_blocked',
  ADMIN_ASSIGNED: 'admin_assigned',
  MUTE_APPLIED: 'mute_applied',
  WARNING_ISSUED: 'warning_issued',
  ADMIN_NOTIFIED: 'admin_notified',
  ATTACHMENT_REJECTED: 'attachment_rejected',
  ATTACHMENT_FLAGGED: 'attachment_flagged',
  ATTACHMENT_REVIEWED: 'attachment_reviewed',
});

/** Image types eligible for OCR evidence scanning. */
export const DISPUTE_CHAT_IMAGE_EXTENSIONS = Object.freeze([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
]);

export const DISPUTE_CHAT_OCR_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  FAILED: 'failed',
});

export const DISPUTE_CHAT_OCR_STATUS_VALUES = Object.freeze(
  Object.values(DISPUTE_CHAT_OCR_STATUS),
);

export const DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  CLEARED: 'cleared',
  CONFIRMED_VIOLATION: 'confirmed_violation',
});

export const DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS_VALUES = Object.freeze(
  Object.values(DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS),
);

export const DISPUTE_CHAT_AUDIT_ACTION_VALUES = Object.freeze(
  Object.values(DISPUTE_CHAT_AUDIT_ACTIONS),
);

export const CONTACT_FILTER_MESSAGE = 'For your security, sharing personal contact information or external links is not allowed.';
export const CONTACT_FILTER_CODE = 'CONTACT_INFO_BLOCKED';

export const DISPUTE_CHAT_RATE_LIMIT = Object.freeze({
  MAX_MESSAGES_PER_MINUTE: 10,
  WINDOW_MS: 60_000,
});

export const DISPUTE_CHAT_MUTE_DURATION_MS = 30 * 60 * 1000; // 30 minutes after 2nd violation

export const DISPUTE_CHAT_VIOLATION_THRESHOLDS = Object.freeze({
  WARNING: 1,
  MUTE: 2,
  NOTIFY_ADMIN: 3,
});

/** Allowed chat attachment extensions (lowercase, no dot). */
export const DISPUTE_CHAT_ALLOWED_EXTENSIONS = Object.freeze([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'pdf',
  'zip',
  'txt',
]);

/** Explicitly rejected executable / dangerous extensions. */
export const DISPUTE_CHAT_BLOCKED_EXTENSIONS = Object.freeze([
  'exe', 'bat', 'cmd', 'com', 'msi', 'dll', 'scr', 'ps1', 'sh', 'bash',
  'js', 'mjs', 'cjs', 'jar', 'apk', 'dmg', 'app', 'bin', 'vbs', 'wsf',
  'php', 'py', 'rb', 'pl', 'cgi', 'hta', 'iso', 'img',
]);

export default {
  DISPUTE_CHAT_STATUS,
  DISPUTE_CHAT_STATUS_VALUES,
  DISPUTE_CHAT_MESSAGE_STATUS,
  DISPUTE_CHAT_MESSAGE_STATUS_VALUES,
  DISPUTE_CHAT_ROLES,
  DISPUTE_CHAT_ROLE_VALUES,
  DISPUTE_CHAT_AUDIT_ACTIONS,
  DISPUTE_CHAT_AUDIT_ACTION_VALUES,
  CONTACT_FILTER_MESSAGE,
  CONTACT_FILTER_CODE,
  DISPUTE_CHAT_RATE_LIMIT,
  DISPUTE_CHAT_MUTE_DURATION_MS,
  DISPUTE_CHAT_VIOLATION_THRESHOLDS,
  DISPUTE_CHAT_ALLOWED_EXTENSIONS,
  DISPUTE_CHAT_BLOCKED_EXTENSIONS,
  DISPUTE_CHAT_IMAGE_EXTENSIONS,
  DISPUTE_CHAT_OCR_STATUS,
  DISPUTE_CHAT_OCR_STATUS_VALUES,
  DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS,
  DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS_VALUES,
};
