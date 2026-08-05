import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { env } from '../config/env.js';
import {
  Dispute,
  DisputeChatMessage,
  DisputeReplacement,
  Order,
} from '../models/index.js';
import { DISPUTE_CHAT_ROLES } from '../constants/disputeChat.js';
import { DISPUTE_STATUS } from '../constants/statuses.js';
import {
  DISPUTE_TIMELINE_EVENTS,
  ORDER_ACCOUNT_STATUS,
  REPLACEMENT_STATUS,
} from '../constants/disputeFinal.js';
import {
  DISPUTE_CHAT_AUDIT_ACTIONS,
} from '../constants/disputeChat.js';
import {
  encryptSensitiveObject,
  decryptSensitiveObject,
  encryptCredential,
  decryptCredential,
  redactForLogs,
} from '../utils/credentials.crypto.js';
import { USER_ROLES } from '../constants/roles.js';
import * as disputeChatService from './disputeChat.service.js';
import * as disputeTimelineService from './disputeTimeline.service.js';
import * as escrowService from './escrow.service.js';
import { logActivity } from './activity.service.js';
import { DisputeChatAuditLog } from '../models/index.js';
import { emitDomainEvent } from '../events/bus.js';
import { DOMAIN_EVENTS } from '../constants/events.js';

function actorId(actor) {
  return actor?.id || actor?._id;
}

function isSuperAdmin(actor) {
  return actor?.roles?.includes(USER_ROLES.SUPER_ADMIN);
}

function canAccessDispute(dispute, actor) {
  const id = String(actorId(actor));
  return String(dispute.buyer) === id
    || String(dispute.sellerUser) === id
    || (dispute.assignedAdmin && String(dispute.assignedAdmin) === id)
    || isSuperAdmin(actor);
}

function serializeReplacement(doc, { includeMasked = true } = {}) {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return {
    ...plain,
    hasCredentialBlob: Boolean(plain.hasCredentialBlob || plain.credentialBlobEncrypted),
    // never include encrypted blobs in list responses
    credentialBlobEncrypted: undefined,
    accounts: (plain.accounts || []).map((account) => ({
      _id: account._id,
      accountIdentifier: account.accountIdentifier,
      notes: account.notes,
      masked: includeMasked ? account.masked : undefined,
    })),
  };
}

const DEFAULT_MAX_REPLACEMENT_ATTEMPTS = 3;

function isStaffActor(actor) {
  return actor?.roles?.some((r) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(r));
}

function maxAttemptsFor(dispute) {
  const configured = Number(dispute.maxReplacementAttempts);
  return Number.isFinite(configured) && configured >= 1
    ? configured
    : DEFAULT_MAX_REPLACEMENT_ATTEMPTS;
}

function attemptsUsed(dispute) {
  return Math.max(
    Number(dispute.replacementAttempts) || 0,
    Number(dispute.latestReplacementVersion) || 0,
  );
}

/**
 * Seller submits a replacement.
 * Prefer a single credentialBlob (exact text). Never auto-closes the dispute.
 * Status → waiting_for_buyer_confirmation.
 * Sellers are capped at maxReplacementAttempts (default 3). Admins may bypass.
 */
export async function sendReplacement(disputeId, payload, actor, requestMeta = {}) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });

  const staffBypass = isStaffActor(actor);
  if (String(dispute.sellerUser) !== String(actorId(actor)) && !staffBypass) {
    throw new AppError('Only the seller can send replacements', 403, { code: 'FORBIDDEN' });
  }
  if ([DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.status)) {
    throw new AppError('Dispute is closed', 400, { code: 'DISPUTE_CLOSED' });
  }

  if (
    dispute.status === DISPUTE_STATUS.WAITING_FOR_BUYER_CONFIRMATION
    && !staffBypass
  ) {
    throw new AppError('Waiting for buyer confirmation on the current replacement', 400, {
      code: 'WAITING_FOR_BUYER',
    });
  }

  const maxAttempts = maxAttemptsFor(dispute);
  const used = attemptsUsed(dispute);
  const atLimit = used >= maxAttempts
    || dispute.status === DISPUTE_STATUS.MAXIMUM_REPLACEMENTS_REACHED;

  if (atLimit && !staffBypass) {
    throw new AppError('Maximum replacement attempts reached', 400, {
      code: 'MAX_REPLACEMENTS_REACHED',
      details: {
        replacementAttempts: used,
        maxReplacementAttempts: maxAttempts,
      },
    });
  }

  const chat = await disputeChatService.getChatByDisputeId(disputeId);
  if (!chat || chat.status === 'read_only' || chat.status === 'closed') {
    throw new AppError('Dispute chat is read-only', 400, { code: 'CHAT_READ_ONLY' });
  }

  const blobRaw = typeof payload.credentialBlob === 'string' ? payload.credentialBlob : '';
  // Preserve exact formatting — only reject empty/whitespace-only payloads.
  const hasBlob = blobRaw.trim().length > 0;
  const legacyAccounts = Array.isArray(payload.accounts) ? payload.accounts : [];

  if (!hasBlob && legacyAccounts.length === 0) {
    throw new AppError('Replacement credentials are required', 400, { code: 'REPLACEMENT_EMPTY' });
  }

  const expireAt = new Date(
    Date.now() + (env.DISPUTE_CREDENTIAL_TTL_DAYS || 30) * 24 * 60 * 60 * 1000,
  );

  let accounts = [];
  let credentialBlobEncrypted = null;
  let hasCredentialBlob = false;
  let accountCount = 0;

  if (hasBlob) {
    // Store EXACTLY as submitted (including leading/trailing whitespace inside the paste).
    credentialBlobEncrypted = encryptCredential(blobRaw);
    hasCredentialBlob = true;
    accountCount = 1;
    accounts = [{
      accountIdentifier: 'replacement',
      notes: '',
      encrypted: {},
      masked: { preview: '•••• replacement credentials' },
    }];
  } else {
    accounts = legacyAccounts.map((account) => {
      const { encrypted, masked } = encryptSensitiveObject(account);
      return {
        accountIdentifier: account.accountIdentifier,
        notes: account.notes || '',
        encrypted,
        masked,
      };
    });
    accountCount = accounts.length;
  }

  const version = (dispute.latestReplacementVersion || 0) + 1;

  // Admin override past the cap: raise the stored max so subsequent seller attempts stay consistent.
  if (staffBypass && version > maxAttempts) {
    dispute.maxReplacementAttempts = version;
  }

  await DisputeReplacement.updateMany(
    { dispute: dispute._id, status: REPLACEMENT_STATUS.PENDING },
    { $set: { status: REPLACEMENT_STATUS.SUPERSEDED } },
  );

  const replacement = await DisputeReplacement.create({
    dispute: dispute._id,
    order: dispute.order,
    chat: chat._id,
    version,
    status: REPLACEMENT_STATUS.PENDING,
    accounts,
    accountCount,
    notes: payload.notes || '',
    createdBy: actorId(actor),
    credentialsExpireAt: expireAt,
    credentialBlobEncrypted,
    hasCredentialBlob,
  });

  // NEVER auto-close. Only wait for buyer confirmation.
  dispute.latestReplacementVersion = version;
  dispute.replacementAttempts = version;
  dispute.replacementQuantity = accountCount;
  dispute.status = DISPUTE_STATUS.WAITING_FOR_BUYER_CONFIRMATION;
  if (!dispute.firstReplacementAt) {
    dispute.firstReplacementAt = new Date();
  }
  await dispute.save();

  await DisputeChatMessage.create({
    chat: chat._id,
    dispute: dispute._id,
    order: dispute.order,
    author: actorId(actor),
    role: DISPUTE_CHAT_ROLES.SYSTEM,
    body: `Seller sent Replacement v${version}. Waiting for buyer confirmation.`,
    attachments: [],
  });
  chat.messageCount = (chat.messageCount || 0) + 1;
  chat.lastMessageAt = new Date();
  await chat.save();

  await disputeTimelineService.appendTimelineEvent({
    disputeId: dispute._id,
    orderId: dispute.order,
    event: DISPUTE_TIMELINE_EVENTS.REPLACEMENT_SENT,
    actor,
    role: 'seller',
    message: `Replacement v${version} submitted`,
    meta: {
      version,
      accountCount,
      replacementId: replacement._id,
      hasCredentialBlob,
    },
  });

  await DisputeChatAuditLog.create({
    chat: chat._id,
    dispute: dispute._id,
    order: dispute.order,
    actor: actorId(actor),
    action: DISPUTE_CHAT_AUDIT_ACTIONS.REPLACEMENT_SENT,
    meta: redactForLogs({ version, accountCount, replacementId: replacement._id, hasCredentialBlob }),
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  await logActivity({
    userId: actorId(actor),
    action: 'disputes.replacement_sent',
    resource: 'DisputeReplacement',
    resourceId: replacement._id,
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    meta: { disputeId, version, accountCount, hasCredentialBlob },
  });

  const serialized = serializeReplacement(replacement);
  emitDomainEvent(DOMAIN_EVENTS.REPLACEMENT_REQUESTED, {
    dispute: dispute.toObject ? dispute.toObject() : dispute,
    replacement: serialized,
    order: { orderNumber: dispute.orderNumber, _id: dispute.order },
  });

  return serialized;
}

export async function listReplacements(disputeId, actor) {
  const dispute = await Dispute.findById(disputeId).lean();
  if (!dispute) throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  if (!canAccessDispute(dispute, actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const items = await DisputeReplacement.find({ dispute: disputeId })
    .sort({ version: 1 })
    .lean();
  return items.map((item) => serializeReplacement(item));
}

export async function respondToReplacement(
  disputeId,
  replacementId,
  payload,
  actor,
  requestMeta = {},
) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });

  if (String(dispute.buyer) !== String(actorId(actor)) && !isSuperAdmin(actor)) {
    throw new AppError('Only the buyer can respond to replacements', 403, { code: 'FORBIDDEN' });
  }

  const replacement = await DisputeReplacement.findOne({
    _id: replacementId,
    dispute: disputeId,
  });
  if (!replacement) {
    throw new AppError('Replacement not found', 404, { code: 'REPLACEMENT_NOT_FOUND' });
  }
  if (replacement.status !== REPLACEMENT_STATUS.PENDING) {
    throw new AppError('Replacement is not pending', 400, { code: 'REPLACEMENT_NOT_PENDING' });
  }

  const decision = payload.decision;
  if (decision === 'rejected') {
    replacement.status = REPLACEMENT_STATUS.REJECTED;
    replacement.respondedBy = actorId(actor);
    replacement.respondedAt = new Date();
    replacement.responseNote = payload.note || null;
    await replacement.save();

    const maxAttempts = maxAttemptsFor(dispute);
    const attemptNumber = Math.max(
      Number(replacement.version) || 0,
      attemptsUsed(dispute),
    );
    dispute.replacementAttempts = attemptNumber;
    dispute.latestReplacementVersion = Math.max(
      dispute.latestReplacementVersion || 0,
      attemptNumber,
    );

    const limitReached = attemptNumber >= maxAttempts;
    if (limitReached) {
      // No 4th replacement — start final 24h timer for automatic buyer refund.
      dispute.status = DISPUTE_STATUS.MAXIMUM_REPLACEMENTS_REACHED;
      dispute.sellerResponseDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      // Seller may submit another replacement.
      dispute.status = DISPUTE_STATUS.OPEN;
    }
    await dispute.save();

    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.BUYER_REJECTED_REPLACEMENT,
      actor,
      role: 'buyer',
      message: `Buyer rejected replacement v${replacement.version}`,
      meta: {
        version: replacement.version,
        replacementId,
        replacementAttempts: attemptNumber,
        maxReplacementAttempts: maxAttempts,
      },
    });
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.REPLACEMENT_REJECTED,
      actor,
      role: 'buyer',
      message: limitReached
        ? `Replacement v${replacement.version} rejected — maximum attempts reached`
        : `Replacement v${replacement.version} rejected — dispute reopened`,
      meta: {
        version: replacement.version,
        replacementId,
        replacementAttempts: attemptNumber,
        maxReplacementAttempts: maxAttempts,
        maximumReplacementsReached: limitReached,
        sellerResponseDeadline: dispute.sellerResponseDeadline,
      },
    });

    const serialized = serializeReplacement(replacement);
    emitDomainEvent(DOMAIN_EVENTS.REPLACEMENT_REJECTED, {
      dispute: dispute.toObject ? dispute.toObject() : dispute,
      replacement: serialized,
      order: { orderNumber: dispute.orderNumber, _id: dispute.order },
    });

    return serialized;
  }

  // Accepted — resolve disputed items & release disputed escrow to seller
  return withTransaction(async (session) => {
    replacement.status = REPLACEMENT_STATUS.ACCEPTED;
    replacement.respondedBy = actorId(actor);
    replacement.respondedAt = new Date();
    replacement.responseNote = payload.note || null;
    if (session) await replacement.save({ session });
    else await replacement.save();

    const resolvedQty = Math.min(
      dispute.disputedQuantity,
      replacement.accountCount || dispute.disputedQuantity,
    );
    dispute.resolvedQuantity = resolvedQty;
    dispute.heldQuantity = Math.max(0, dispute.disputedQuantity - resolvedQty);
    dispute.remainingQuantity = dispute.heldQuantity;
    dispute.releasedQuantity = (dispute.releasedQuantity || 0) + resolvedQty;
    dispute.status = DISPUTE_STATUS.RESOLVED;
    dispute.resolution = 'release';
    dispute.resolutionNote = payload.note || `Replacement v${replacement.version} accepted`;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = actorId(actor);
    if (session) await dispute.save({ session });
    else await dispute.save();

    const order = await Order.findById(dispute.order).session(session || null);
    if (order?.accounts?.length && dispute.disputedAccountIds?.length) {
      for (const account of order.accounts) {
        if (dispute.disputedAccountIds.some((id) => String(id) === String(account._id))) {
          account.status = ORDER_ACCOUNT_STATUS.REPLACED;
        }
      }
      if (session) await order.save({ session });
      else await order.save();
    }

    await escrowService.releaseDisputedEscrowPortion(dispute.escrow, {
      reason: `replacement_v${replacement.version}_accepted`,
      actor,
      session,
      dispute,
    });

    await disputeChatService.setChatReadOnly(dispute._id, { session, expireCredentials: true });

    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.BUYER_ACCEPTED_REPLACEMENT,
      actor,
      role: 'buyer',
      message: `Buyer accepted replacement v${replacement.version}`,
      meta: { version: replacement.version, replacementId },
      session,
    });
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.REPLACEMENT_ACCEPTED,
      actor,
      role: 'buyer',
      message: `Replacement v${replacement.version} accepted`,
      meta: { version: replacement.version, replacementId },
      session,
    });
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.BUYER_CLOSED_DISPUTE,
      actor,
      role: 'buyer',
      message: 'Buyer closed dispute — account works',
      meta: { resolution: 'release' },
      session,
    });
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.DISPUTE_CLOSED,
      actor,
      role: 'system',
      message: 'Dispute resolved via accepted replacement',
      meta: { resolution: 'release' },
      session,
    });

    await logActivity({
      userId: actorId(actor),
      action: 'disputes.replacement_accepted',
      resource: 'DisputeReplacement',
      resourceId: replacement._id,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      meta: { disputeId, version: replacement.version },
      session,
    });

    const serialized = serializeReplacement(replacement);
    const disputePlain = dispute.toObject ? dispute.toObject() : dispute;
    const orderPlain = order?.toObject
      ? order.toObject()
      : (order || { _id: dispute.order, orderNumber: dispute.orderNumber });

    emitDomainEvent(DOMAIN_EVENTS.REPLACEMENT_ACCEPTED, {
      dispute: disputePlain,
      replacement: serialized,
      order: orderPlain,
    });
    emitDomainEvent(DOMAIN_EVENTS.DISPUTE_RESOLVED, {
      dispute: disputePlain,
      order: orderPlain,
      resolution: 'release',
    });

    return serialized;
  });
}

export async function revealReplacementAccount(
  disputeId,
  replacementId,
  accountId,
  actor,
  requestMeta = {},
) {
  const dispute = await Dispute.findById(disputeId).lean();
  if (!dispute) throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  if (!canAccessDispute(dispute, actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const replacement = await DisputeReplacement.findOne({
    _id: replacementId,
    dispute: disputeId,
  });
  if (!replacement) {
    throw new AppError('Replacement not found', 404, { code: 'REPLACEMENT_NOT_FOUND' });
  }
  if (replacement.credentialsExpired
    || (replacement.credentialsExpireAt && replacement.credentialsExpireAt < new Date())) {
    throw new AppError('Credentials have expired', 410, { code: 'CREDENTIALS_EXPIRED' });
  }

  // Blob-mode replacements: reveal exact text (buyer/seller only).
  if (replacement.hasCredentialBlob || replacement.credentialBlobEncrypted) {
    const credentialBlob = decryptCredential(replacement.credentialBlobEncrypted);
    await disputeTimelineService.appendTimelineEvent({
      disputeId,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.BUYER_VIEWED_REPLACEMENT,
      actor,
      role: 'participant',
      message: `Viewed replacement v${replacement.version} credentials`,
      meta: { replacementId, version: replacement.version },
    });
    return {
      replacementId,
      version: replacement.version,
      hasCredentialBlob: true,
      credentialBlob,
      credentials: { credentialBlob },
    };
  }

  const account = replacement.accounts.id(accountId);
  if (!account) {
    throw new AppError('Account not found', 404, { code: 'ACCOUNT_NOT_FOUND' });
  }

  const revealed = decryptSensitiveObject(account.encrypted || {});

  await disputeTimelineService.appendTimelineEvent({
    disputeId,
    orderId: dispute.order,
    event: DISPUTE_TIMELINE_EVENTS.CREDENTIAL_REVEALED,
    actor,
    role: 'participant',
    message: `Revealed replacement v${replacement.version} account credentials`,
    meta: { replacementId, accountId, accountIdentifier: account.accountIdentifier },
  });

  const chat = await disputeChatService.getChatByDisputeId(disputeId);
  if (chat) {
    await DisputeChatAuditLog.create({
      chat: chat._id,
      dispute: disputeId,
      order: dispute.order,
      actor: actorId(actor),
      action: DISPUTE_CHAT_AUDIT_ACTIONS.CREDENTIAL_REVEALED,
      meta: { replacementId, accountId, source: 'replacement' },
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });
  }

  return {
    replacementId,
    version: replacement.version,
    accountId,
    accountIdentifier: account.accountIdentifier,
    credentials: revealed,
  };
}

/**
 * Reveal the full replacement blob (or compose legacy accounts) for buyer/seller.
 */
export async function revealReplacementBlob(
  disputeId,
  replacementId,
  actor,
  requestMeta = {},
) {
  const dispute = await Dispute.findById(disputeId).lean();
  if (!dispute) throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  if (!canAccessDispute(dispute, actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const replacement = await DisputeReplacement.findOne({
    _id: replacementId,
    dispute: disputeId,
  });
  if (!replacement) {
    throw new AppError('Replacement not found', 404, { code: 'REPLACEMENT_NOT_FOUND' });
  }
  if (replacement.credentialsExpired
    || (replacement.credentialsExpireAt && replacement.credentialsExpireAt < new Date())) {
    throw new AppError('Credentials have expired', 410, { code: 'CREDENTIALS_EXPIRED' });
  }

  let credentialBlob = '';
  if (replacement.hasCredentialBlob || replacement.credentialBlobEncrypted) {
    credentialBlob = decryptCredential(replacement.credentialBlobEncrypted) || '';
  } else {
    const lines = [];
    for (const account of replacement.accounts || []) {
      const fields = decryptSensitiveObject(account.encrypted || {});
      lines.push(`Account: ${account.accountIdentifier || 'replacement'}`);
      for (const [key, value] of Object.entries(fields)) {
        if (value != null && value !== '') lines.push(`${key}: ${value}`);
      }
      if (account.notes) lines.push(`notes: ${account.notes}`);
      lines.push('');
    }
    credentialBlob = lines.join('\n').trimEnd();
  }

  await disputeTimelineService.appendTimelineEvent({
    disputeId,
    orderId: dispute.order,
    event: DISPUTE_TIMELINE_EVENTS.BUYER_VIEWED_REPLACEMENT,
    actor,
    role: 'participant',
    message: `Buyer viewed replacement v${replacement.version}`,
    meta: { replacementId, version: replacement.version },
  });

  return {
    replacementId: String(replacement._id),
    version: replacement.version,
    hasCredentialBlob: true,
    credentialBlob,
  };
}

export default {
  sendReplacement,
  listReplacements,
  respondToReplacement,
  revealReplacementAccount,
  revealReplacementBlob,
};
