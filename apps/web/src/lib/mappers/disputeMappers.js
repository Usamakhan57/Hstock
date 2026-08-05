import { formatMoney } from '../../constants/commerce';

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || null;
}

export const DISPUTE_STATUS_LABEL = {
  open: 'Open',
  under_review: 'Under Review',
  waiting_for_buyer_confirmation: 'Waiting for Buyer Confirmation',
  maximum_replacements_reached: 'Maximum Replacements Reached',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const TIMELINE_EVENT_LABEL = {
  dispute_created: 'Dispute Opened',
  quantity_selected: 'Quantity Selected',
  chat_started: 'Chat Started',
  evidence_uploaded: 'Evidence Uploaded',
  ocr_flagged: 'OCR Review Flagged',
  replacement_sent: 'Replacement Submitted',
  replacement_accepted: 'Buyer Accepted Replacement',
  replacement_rejected: 'Buyer Rejected Replacement',
  buyer_viewed_replacement: 'Buyer Viewed Replacement',
  buyer_accepted_replacement: 'Buyer Accepted Replacement',
  buyer_closed_dispute: 'Buyer Closed Dispute',
  buyer_rejected_replacement: 'Buyer Rejected Replacement',
  refund_approved: 'Refund Approved',
  refund_issued: 'Refund Issued',
  escrow_released: 'Escrow Released',
  escrow_held: 'Escrow Held',
  admin_decision: 'Admin Action',
  dispute_closed: 'Closed',
  credential_revealed: 'Credentials Revealed',
  message_blocked: 'Message Blocked',
  chat_read_only: 'Chat Read-Only',
  resolved: 'Resolved',
};

export const REPLACEMENT_STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  superseded: 'Superseded',
};

export function mapBackendDispute(dispute) {
  if (!dispute) return null;
  const order = typeof dispute.order === 'object' && dispute.order ? dispute.order : null;
  const status = dispute.status || 'open';
  const orderQuantity = dispute.orderQuantity ?? order?.quantity ?? 1;
  const disputedQuantity = dispute.disputedQuantity ?? orderQuantity;
  const remainingQuantity = Math.max(0, orderQuantity - disputedQuantity);

  return {
    id: idOf(dispute),
    disputeNumber: dispute.disputeNumber || idOf(dispute),
    orderId: idOf(order) || idOf(dispute.order),
    orderNumber: order?.orderNumber || dispute.orderNumber || null,
    reason: dispute.reason || '',
    description: dispute.description || '',
    status,
    statusLabel: DISPUTE_STATUS_LABEL[status] || status,
    isPartial: !!dispute.isPartial || disputedQuantity < orderQuantity,
    orderQuantity,
    disputedQuantity,
    remainingQuantity,
    heldQuantity: dispute.heldQuantity ?? disputedQuantity,
    disputedAmount: formatMoney(dispute.disputedAmount),
    disputedAccountIds: (dispute.disputedAccountIds || []).map(idOf).filter(Boolean),
    evidence: Array.isArray(dispute.evidence) ? dispute.evidence : [],
    evidenceUrls: Array.isArray(dispute.evidence) ? dispute.evidence : [],
    productTitle: order?.productSnapshot?.title || order?.product?.title || 'Order',
    productImg: order?.productSnapshot?.thumbnail || order?.product?.thumbnail || '',
    buyerId: idOf(dispute.buyer) || idOf(order?.buyer),
    sellerId: idOf(dispute.sellerUser) || idOf(dispute.seller) || idOf(order?.sellerUser),
    chatId: idOf(dispute.chat),
    chatReadOnly: dispute.chat?.status === 'read_only'
      || status === 'resolved'
      || status === 'closed',
    resolution: dispute.resolution || null,
    replacementAttempts: dispute.replacementAttempts ?? dispute.latestReplacementVersion ?? 0,
    maxReplacementAttempts: dispute.maxReplacementAttempts ?? 3,
    sellerResponseDeadline: dispute.sellerResponseDeadline || null,
    createdAt: dispute.createdAt || null,
    updatedAt: dispute.updatedAt || null,
    resolvedAt: dispute.resolvedAt || null,
    raw: dispute,
  };
}

export function mapDisputeDashboard(dashboard) {
  if (!dashboard) return null;
  const quantities = dashboard.quantities || {};
  const amounts = dashboard.amounts || {};
  return {
    quantities: {
      order: quantities.order ?? quantities.orderQuantity ?? 0,
      disputed: quantities.disputed ?? quantities.disputedQuantity ?? 0,
      held: quantities.held ?? quantities.heldQuantity ?? 0,
      remaining: quantities.remaining ?? quantities.remainingQuantity ?? 0,
      resolved: quantities.resolved ?? 0,
      replacement: quantities.replacement ?? 0,
      refund: quantities.refund ?? 0,
      released: quantities.released ?? 0,
    },
    amounts: {
      orderTotal: formatMoney(amounts.orderTotal ?? amounts.order),
      disputed: formatMoney(amounts.disputed),
      held: formatMoney(amounts.held),
      released: formatMoney(amounts.released),
      refunded: formatMoney(amounts.refunded),
      undisputed: formatMoney(amounts.undisputed),
    },
    ocrFlags: dashboard.ocrFlags ?? dashboard.ocrFlagCount ?? 0,
    violationCount: dashboard.violationCount ?? 0,
    replacementAttempts: dashboard.replacementAttempts ?? 0,
    maxReplacementAttempts: dashboard.maxReplacementAttempts ?? 3,
    canReplace: dashboard.canReplace !== undefined ? Boolean(dashboard.canReplace) : true,
    sellerResponseDeadline: dashboard.timers?.sellerResponseDeadline || null,
    replacementHistory: Array.isArray(dashboard.replacementHistory)
      ? dashboard.replacementHistory.map(mapReplacement)
      : [],
    timeline: Array.isArray(dashboard.timeline)
      ? dashboard.timeline.map(mapTimelineEvent)
      : [],
    raw: dashboard,
  };
}

export function mapTimelineEvent(event) {
  if (!event) return null;
  const type = event.type || event.event || event.name || 'event';
  return {
    id: idOf(event) || `${type}-${event.createdAt || event.at || ''}`,
    type,
    label: TIMELINE_EVENT_LABEL[type] || event.message || type.replace(/_/g, ' '),
    message: event.message || '',
    meta: event.meta || {},
    actorRole: event.actorRole || event.role || null,
    createdAt: event.createdAt || event.at || null,
  };
}

export function mapChatMessage(message) {
  if (!message) return null;
  const attachments = Array.isArray(message.attachments)
    ? message.attachments.map((a) => (typeof a === 'string'
      ? { url: a, ocrFlagged: false }
      : {
        id: idOf(a),
        url: a.url || a.href || '',
        filename: a.filename || a.name || null,
        ocrFlagged: !!(a.ocrFlagged || a.flagged || a.ocrStatus === 'flagged'),
        ocrStatus: a.ocrStatus || null,
      }))
    : [];

  return {
    id: idOf(message),
    body: message.deletedAt ? '[Message deleted]' : (message.body || message.text || ''),
    senderId: idOf(message.sender) || idOf(message.senderId),
    senderRole: message.senderRole || message.role || 'buyer',
    attachments,
    hasCredentials: !!(message.hasCredentials || message.credentialsMasked || message.credentials),
    credentialsMasked: message.credentialsMasked || message.masked || null,
    editedAt: message.editedAt || null,
    deletedAt: message.deletedAt || null,
    createdAt: message.createdAt || null,
    readOnly: !!message.readOnly,
    blocked: !!message.blocked,
    raw: message,
  };
}

export function mapReplacement(replacement) {
  if (!replacement) return null;
  const status = replacement.status || 'pending';
  const version = replacement.version ?? replacement.versionNumber ?? 1;
  return {
    id: idOf(replacement),
    version,
    versionLabel: `v${version}`,
    status,
    statusLabel: REPLACEMENT_STATUS_LABEL[status] || status,
    notes: replacement.notes || '',
    hasCredentialBlob: Boolean(replacement.hasCredentialBlob),
    accounts: Array.isArray(replacement.accounts)
      ? replacement.accounts.map((account) => ({
        id: idOf(account),
        accountIdentifier: account.accountIdentifier || account.identifier || 'Account',
        notes: account.notes || '',
        masked: account.masked || account.credentialsMasked || null,
        username: account.username || account.masked?.username || null,
        email: account.email || account.masked?.email || null,
      }))
      : [],
    createdAt: replacement.createdAt || null,
    respondedAt: replacement.respondedAt || null,
    responseNote: replacement.responseNote || replacement.buyerNote || null,
    raw: replacement,
  };
}

export default {
  mapBackendDispute,
  mapDisputeDashboard,
  mapTimelineEvent,
  mapChatMessage,
  mapReplacement,
  DISPUTE_STATUS_LABEL,
  TIMELINE_EVENT_LABEL,
  REPLACEMENT_STATUS_LABEL,
};
