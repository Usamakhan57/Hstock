export const DISPUTE_TIMELINE_EVENTS = Object.freeze({
  DISPUTE_CREATED: 'dispute_created',
  QUANTITY_SELECTED: 'quantity_selected',
  CHAT_STARTED: 'chat_started',
  EVIDENCE_UPLOADED: 'evidence_uploaded',
  OCR_FLAGGED: 'ocr_flagged',
  REPLACEMENT_SENT: 'replacement_sent',
  REPLACEMENT_ACCEPTED: 'replacement_accepted',
  REPLACEMENT_REJECTED: 'replacement_rejected',
  REFUND_APPROVED: 'refund_approved',
  ESCROW_RELEASED: 'escrow_released',
  ADMIN_DECISION: 'admin_decision',
  DISPUTE_CLOSED: 'dispute_closed',
  CREDENTIAL_REVEALED: 'credential_revealed',
  MESSAGE_BLOCKED: 'message_blocked',
  CHAT_READ_ONLY: 'chat_read_only',
});

export const DISPUTE_TIMELINE_EVENT_VALUES = Object.freeze(
  Object.values(DISPUTE_TIMELINE_EVENTS),
);

export const REPLACEMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  SUPERSEDED: 'superseded',
});

export const REPLACEMENT_STATUS_VALUES = Object.freeze(Object.values(REPLACEMENT_STATUS));

export const ORDER_ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'active',
  DISPUTED: 'disputed',
  REPLACED: 'replaced',
  REFUNDED: 'refunded',
  RESOLVED: 'resolved',
});

export const ORDER_ACCOUNT_STATUS_VALUES = Object.freeze(Object.values(ORDER_ACCOUNT_STATUS));

export const DISPUTE_CHAT_MODE = Object.freeze({
  OPEN: 'open',
  READ_ONLY: 'read_only',
});

export default {
  DISPUTE_TIMELINE_EVENTS,
  DISPUTE_TIMELINE_EVENT_VALUES,
  REPLACEMENT_STATUS,
  REPLACEMENT_STATUS_VALUES,
  ORDER_ACCOUNT_STATUS,
  ORDER_ACCOUNT_STATUS_VALUES,
  DISPUTE_CHAT_MODE,
};
