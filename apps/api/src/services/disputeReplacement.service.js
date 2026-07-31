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
  redactForLogs,
} from '../utils/credentials.crypto.js';
import { USER_ROLES } from '../constants/roles.js';
import * as disputeChatService from './disputeChat.service.js';
import * as disputeTimelineService from './disputeTimeline.service.js';
import * as escrowService from './escrow.service.js';
import { logActivity } from './activity.service.js';
import { DisputeChatAuditLog } from '../models/index.js';

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
    accounts: (plain.accounts || []).map((account) => ({
      _id: account._id,
      accountIdentifier: account.accountIdentifier,
      notes: account.notes,
      masked: includeMasked ? account.masked : undefined,
      // never include encrypted blobs in list responses
    })),
  };
}

export async function sendReplacement(disputeId, payload, actor, requestMeta = {}) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });

  if (String(dispute.sellerUser) !== String(actorId(actor)) && !isSuperAdmin(actor)) {
    throw new AppError('Only the seller can send replacements', 403, { code: 'FORBIDDEN' });
  }
  if ([DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.status)) {
    throw new AppError('Dispute is closed', 400, { code: 'DISPUTE_CLOSED' });
  }

  const chat = await disputeChatService.getChatByDisputeId(disputeId);
  if (!chat || chat.status === 'read_only' || chat.status === 'closed') {
    throw new AppError('Dispute chat is read-only', 400, { code: 'CHAT_READ_ONLY' });
  }

  const expireAt = new Date(
    Date.now() + (env.DISPUTE_CREDENTIAL_TTL_DAYS || 30) * 24 * 60 * 60 * 1000,
  );

  const accounts = (payload.accounts || []).map((account) => {
    const { encrypted, masked } = encryptSensitiveObject(account);
    return {
      accountIdentifier: account.accountIdentifier,
      notes: account.notes || '',
      encrypted,
      masked,
    };
  });

  const version = (dispute.latestReplacementVersion || 0) + 1;

  // Supersede previous pending replacements
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
    accountCount: accounts.length,
    notes: payload.notes || '',
    createdBy: actorId(actor),
    credentialsExpireAt: expireAt,
  });

  dispute.latestReplacementVersion = version;
  dispute.replacementQuantity = accounts.length;
  await dispute.save();

  await DisputeChatMessage.create({
    chat: chat._id,
    dispute: dispute._id,
    order: dispute.order,
    author: actorId(actor),
    role: DISPUTE_CHAT_ROLES.SYSTEM,
    body: `Seller sent Replacement v${version} (${accounts.length} account(s)). Buyer may Accept or Reject.`,
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
    message: `Replacement v${version} sent (${accounts.length} account(s))`,
    meta: { version, accountCount: accounts.length, replacementId: replacement._id },
  });

  await DisputeChatAuditLog.create({
    chat: chat._id,
    dispute: dispute._id,
    order: dispute.order,
    actor: actorId(actor),
    action: DISPUTE_CHAT_AUDIT_ACTIONS.REPLACEMENT_SENT,
    meta: redactForLogs({ version, accountCount: accounts.length, replacementId: replacement._id }),
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
    meta: { disputeId, version, accountCount: accounts.length },
  });

  return serializeReplacement(replacement);
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

    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.REPLACEMENT_REJECTED,
      actor,
      role: 'buyer',
      message: `Replacement v${replacement.version} rejected`,
      meta: { version: replacement.version, replacementId },
    });

    return serializeReplacement(replacement);
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

    return serializeReplacement(replacement);
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

export default {
  sendReplacement,
  listReplacements,
  respondToReplacement,
  revealReplacementAccount,
};
