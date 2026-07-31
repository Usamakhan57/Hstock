import {
  Dispute,
  DisputeChat,
  DisputeChatMessage,
  DisputeChatBlockedAttempt,
  DisputeChatAuditLog,
  DisputeChatViolation,
  DisputeReplacement,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES } from '../constants/roles.js';
import {
  CONTACT_FILTER_CODE,
  CONTACT_FILTER_MESSAGE,
  DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS,
  DISPUTE_CHAT_AUDIT_ACTIONS,
  DISPUTE_CHAT_IMAGE_EXTENSIONS,
  DISPUTE_CHAT_MESSAGE_STATUS,
  DISPUTE_CHAT_MUTE_DURATION_MS,
  DISPUTE_CHAT_OCR_STATUS,
  DISPUTE_CHAT_RATE_LIMIT,
  DISPUTE_CHAT_ROLES,
  DISPUTE_CHAT_STATUS,
  DISPUTE_CHAT_VIOLATION_THRESHOLDS,
} from '../constants/disputeChat.js';
import { DISPUTE_TIMELINE_EVENTS } from '../constants/disputeFinal.js';
import { DISPUTE_STATUS } from '../constants/statuses.js';
import { env } from '../config/env.js';
import {
  detectBlockedContent,
  detectOcrSensitiveContent,
  validateChatAttachment,
} from '../helpers/contentFilter.helper.js';
import {
  encryptSensitiveObject,
  decryptSensitiveObject,
  redactForLogs,
} from '../utils/credentials.crypto.js';
import { logActivity } from './activity.service.js';
import { extractTextFromImage } from './ocr.service.js';
import * as disputeTimelineService from './disputeTimeline.service.js';

function isSuperAdmin(actor) {
  return actor?.roles?.includes(USER_ROLES.SUPER_ADMIN);
}

function isStaffAdmin(actor) {
  return actor?.roles?.some((r) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(r));
}

function actorId(actor) {
  return actor?.id || actor?._id;
}

async function writeAudit({
  chat,
  dispute,
  order,
  actor,
  action,
  message = null,
  meta = {},
  ip = null,
  userAgent = null,
  session = null,
}) {
  const doc = {
    chat: chat._id || chat,
    dispute: dispute._id || dispute,
    order: order?._id || order || null,
    actor: actor ? actorId(actor) : null,
    action,
    message: message?._id || message || null,
    meta,
    ip,
    userAgent,
  };
  if (session) {
    await DisputeChatAuditLog.create([doc], { session });
  } else {
    await DisputeChatAuditLog.create(doc);
  }
}

export async function createDisputeChat(dispute, { session = null, actor = null, requestMeta = {} } = {}) {
  const payload = {
    dispute: dispute._id,
    order: dispute.order,
    buyer: dispute.buyer,
    sellerUser: dispute.sellerUser,
    seller: dispute.seller,
    assignedAdmin: dispute.assignedAdmin || null,
    assignedAt: dispute.assignedAdmin ? new Date() : null,
    status: DISPUTE_CHAT_STATUS.OPEN,
  };

  const chat = session
    ? (await DisputeChat.create([payload], { session }))[0]
    : await DisputeChat.create(payload);

  await writeAudit({
    chat,
    dispute,
    order: dispute.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.CHAT_CREATED,
    meta: { disputeNumber: dispute.disputeNumber },
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    session,
  });

  // System notice
  const systemMessage = {
    chat: chat._id,
    dispute: dispute._id,
    order: dispute.order,
    author: dispute.buyer,
    role: DISPUTE_CHAT_ROLES.SYSTEM,
    body: 'Secure dispute chat created. Sharing personal contact information or external links is not allowed.',
    attachments: [],
  };
  if (session) {
    await DisputeChatMessage.create([systemMessage], { session });
  } else {
    await DisputeChatMessage.create(systemMessage);
  }

  chat.messageCount = 1;
  chat.lastMessageAt = new Date();
  if (session) await chat.save({ session });
  else await chat.save();

  return chat;
}

export async function getChatByDisputeId(disputeId) {
  return DisputeChat.findOne({ dispute: disputeId });
}

function refId(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    return String(value._id || value.id || value);
  }
  return String(value);
}

function resolveParticipantRole(chat, actor) {
  const id = String(actorId(actor));
  if (refId(chat.buyer) === id) return DISPUTE_CHAT_ROLES.BUYER;
  if (refId(chat.sellerUser) === id) return DISPUTE_CHAT_ROLES.SELLER;
  if (chat.assignedAdmin && refId(chat.assignedAdmin) === id) return DISPUTE_CHAT_ROLES.ADMIN;
  if (isSuperAdmin(actor)) return DISPUTE_CHAT_ROLES.ADMIN;
  return null;
}

export function assertChatAccess(chat, actor, { requireAssignedAdmin = false } = {}) {
  if (!chat) {
    throw new AppError('Dispute chat not found', 404, { code: 'CHAT_NOT_FOUND' });
  }

  const id = String(actorId(actor));
  const isBuyer = refId(chat.buyer) === id;
  const isSeller = refId(chat.sellerUser) === id;
  const isAssigned = Boolean(chat.assignedAdmin) && refId(chat.assignedAdmin) === id;

  if (isBuyer || isSeller || isAssigned || isSuperAdmin(actor)) {
    return resolveParticipantRole(chat, actor);
  }

  // Staff may assign themselves but cannot read chat until assigned
  if (requireAssignedAdmin === false && isStaffAdmin(actor)) {
    throw new AppError(
      'Only the assigned admin moderator can access this chat. Assign yourself first.',
      403,
      { code: 'ADMIN_NOT_ASSIGNED' },
    );
  }

  throw new AppError('Forbidden — private dispute chat', 403, { code: 'FORBIDDEN' });
}

function getActiveMute(chat, userId) {
  const now = Date.now();
  return (chat.mutes || []).find(
    (m) => String(m.user) === String(userId) && new Date(m.until).getTime() > now,
  );
}

async function assertNotMuted(chat, actor) {
  const mute = getActiveMute(chat, actorId(actor));
  if (mute) {
    throw new AppError('You are temporarily muted in this dispute chat', 403, {
      code: 'CHAT_MUTED',
      details: { mutedUntil: mute.until },
    });
  }

  const violation = await DisputeChatViolation.findOne({ user: actorId(actor) }).lean();
  if (violation?.mutedUntil && new Date(violation.mutedUntil).getTime() > Date.now()) {
    throw new AppError('You are temporarily muted from dispute chats', 403, {
      code: 'CHAT_MUTED',
      details: { mutedUntil: violation.mutedUntil },
    });
  }
}

async function assertRateLimit(chat, actor) {
  const since = new Date(Date.now() - DISPUTE_CHAT_RATE_LIMIT.WINDOW_MS);
  const count = await DisputeChatMessage.countDocuments({
    chat: chat._id,
    author: actorId(actor),
    role: { $ne: DISPUTE_CHAT_ROLES.SYSTEM },
    createdAt: { $gte: since },
  });
  if (count >= DISPUTE_CHAT_RATE_LIMIT.MAX_MESSAGES_PER_MINUTE) {
    throw new AppError('Too many messages. Please wait before sending again.', 429, {
      code: 'CHAT_RATE_LIMITED',
    });
  }
}

function attachmentFilename(url) {
  try {
    return new URL(url).pathname.split('/').pop() || null;
  } catch {
    return String(url).split('/').pop() || null;
  }
}

/**
 * Validate file type, store evidence, and OCR-scan images.
 * Screenshots are NEVER auto-rejected for contact-like OCR content —
 * they are flagged for admin review instead.
 */
async function processAttachments(attachments = []) {
  if (!attachments?.length) return [];

  const processed = [];
  for (const item of attachments) {
    const url = typeof item === 'string' ? item : item?.url;
    const check = validateChatAttachment(url);
    if (!check.ok) {
      // Only dangerous/unsupported file types are rejected — never OCR content.
      throw new AppError('Attachment type is not allowed', 400, {
        code: 'ATTACHMENT_REJECTED',
        details: { reason: check.reason, extension: check.extension, url },
      });
    }

    const filename = attachmentFilename(url);
    const attachment = {
      url,
      filename,
      extension: check.extension,
      ocrStatus: DISPUTE_CHAT_OCR_STATUS.SKIPPED,
      ocrText: null,
      ocrConfidence: null,
      ocrFindings: [],
      ocrError: null,
      flaggedForReview: false,
      warningBadge: false,
      adminReviewStatus: null,
    };

    if (DISPUTE_CHAT_IMAGE_EXTENSIONS.includes(check.extension)) {
      // Evidence screenshots (login failed, recovery email, Instagram disabled,
      // Gmail warnings, Facebook checkpoint, cPanel, hosting panels, etc.)
      // must always be stored. OCR only flags for moderator review.
      const ocr = await extractTextFromImage({ url });
      if (ocr.error && !ocr.text) {
        attachment.ocrStatus = DISPUTE_CHAT_OCR_STATUS.FAILED;
        attachment.ocrError = ocr.error;
      } else {
        attachment.ocrStatus = DISPUTE_CHAT_OCR_STATUS.COMPLETED;
        attachment.ocrText = ocr.text || '';
        attachment.ocrConfidence = ocr.confidence;
        const detection = detectOcrSensitiveContent(attachment.ocrText);
        if (detection.sensitive) {
          attachment.flaggedForReview = true;
          attachment.warningBadge = true;
          attachment.ocrFindings = detection.rules;
          attachment.adminReviewStatus = DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS.PENDING;
        }
      }
    }

    processed.push(attachment);
  }
  return processed;
}

function canViewModeratorSignals(chat, actor) {
  if (isSuperAdmin(actor)) return true;
  const id = String(actorId(actor));
  return Boolean(chat.assignedAdmin && refId(chat.assignedAdmin) === id);
}

/**
 * Buyer/seller see images; OCR findings + warning badges are moderator-only.
 * Encrypted credential blobs are never returned — only masked previews.
 */
function presentMessageForActor(message, chat, actor) {
  const plain = typeof message.toObject === 'function' ? message.toObject() : { ...message };
  const base = {
    ...plain,
    credentialsEncrypted: undefined,
    credentials: undefined,
    credentialsMasked: plain.hasCredentials ? (plain.credentialsMasked || {}) : undefined,
  };

  if (canViewModeratorSignals(chat, actor)) {
    return base;
  }

  return {
    ...base,
    moderatorWarningBadge: undefined,
    hasFlaggedAttachments: undefined,
    attachments: (plain.attachments || []).map((attachment) => ({
      _id: attachment._id,
      url: attachment.url,
      filename: attachment.filename,
      extension: attachment.extension,
    })),
  };
}

function assertChatWritable(chat, dispute) {
  if (!chat) {
    throw new AppError('Dispute chat not found', 404, { code: 'CHAT_NOT_FOUND' });
  }
  if ([DISPUTE_CHAT_STATUS.READ_ONLY, DISPUTE_CHAT_STATUS.CLOSED].includes(chat.status)) {
    throw new AppError('Dispute chat is read-only', 400, { code: 'CHAT_READ_ONLY' });
  }
  if (dispute && [DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.status)) {
    throw new AppError('Dispute is closed', 400, { code: 'DISPUTE_CLOSED' });
  }
}

async function recordViolation({
  chat,
  dispute,
  actor,
  role,
  originalMessage,
  rules,
  attachments,
  requestMeta,
}) {
  const userId = actorId(actor);
  let violation = await DisputeChatViolation.findOne({ user: userId });
  if (!violation) {
    violation = new DisputeChatViolation({ user: userId, count: 0, history: [] });
  }

  violation.count += 1;
  let actionTaken = 'warning';

  if (violation.count >= DISPUTE_CHAT_VIOLATION_THRESHOLDS.NOTIFY_ADMIN) {
    actionTaken = 'notify_admin';
    violation.adminNotified = true;
    violation.adminNotifiedAt = new Date();
  } else if (violation.count >= DISPUTE_CHAT_VIOLATION_THRESHOLDS.MUTE) {
    actionTaken = 'mute';
    const until = new Date(Date.now() + DISPUTE_CHAT_MUTE_DURATION_MS);
    violation.mutedUntil = until;
    chat.mutes = [
      ...(chat.mutes || []).filter((m) => String(m.user) !== String(userId)),
      { user: userId, until, reason: 'repeat_violation' },
    ];
    await chat.save();
  }

  violation.history.push({
    at: new Date(),
    dispute: dispute._id || chat.dispute,
    chat: chat._id,
    order: chat.order,
    rules,
    messagePreview: String(originalMessage).slice(0, 500),
    actionTaken,
  });
  await violation.save();

  const blocked = await DisputeChatBlockedAttempt.create({
    chat: chat._id,
    dispute: chat.dispute,
    order: chat.order,
    user: userId,
    role,
    originalMessage,
    detectedRules: rules,
    attachments: attachments || [],
    ip: requestMeta.ip || null,
    userAgent: requestMeta.userAgent || null,
    violationCountAfter: violation.count,
    actionTaken,
  });

  await writeAudit({
    chat,
    dispute: chat.dispute,
    order: chat.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.MESSAGE_BLOCKED,
    meta: {
      rules,
      actionTaken,
      violationCount: violation.count,
      blockedAttemptId: blocked._id,
    },
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  if (actionTaken === 'warning') {
    await writeAudit({
      chat,
      dispute: chat.dispute,
      order: chat.order,
      actor,
      action: DISPUTE_CHAT_AUDIT_ACTIONS.WARNING_ISSUED,
      meta: { violationCount: violation.count },
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });
  } else if (actionTaken === 'mute') {
    await writeAudit({
      chat,
      dispute: chat.dispute,
      order: chat.order,
      actor,
      action: DISPUTE_CHAT_AUDIT_ACTIONS.MUTE_APPLIED,
      meta: { mutedUntil: violation.mutedUntil, violationCount: violation.count },
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });
  } else if (actionTaken === 'notify_admin') {
    await writeAudit({
      chat,
      dispute: chat.dispute,
      order: chat.order,
      actor,
      action: DISPUTE_CHAT_AUDIT_ACTIONS.ADMIN_NOTIFIED,
      meta: { violationCount: violation.count },
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });
    await logActivity({
      userId,
      action: 'dispute_chat.violation_threshold',
      resource: 'DisputeChat',
      resourceId: chat._id,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      meta: {
        disputeId: chat.dispute,
        orderId: chat.order,
        violationCount: violation.count,
        rules,
      },
    });
  }

  return { violation, actionTaken, blocked };
}

export async function getDisputeChat(disputeId, actor) {
  const chat = await DisputeChat.findOne({ dispute: disputeId })
    .populate('assignedAdmin', 'name email roles')
    .populate('buyer', 'name email')
    .populate('sellerUser', 'name email')
    .lean();
  assertChatAccess(chat, actor);
  return chat;
}

export async function listMessages(disputeId, query, actor) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  assertChatAccess(chat, actor);

  const { page, limit, skip } = parsePagination(query);
  const filter = {
    chat: chat._id,
    status: DISPUTE_CHAT_MESSAGE_STATUS.VISIBLE,
  };

  const [items, total] = await Promise.all([
    DisputeChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email roles')
      .lean(),
    DisputeChatMessage.countDocuments(filter),
  ]);

  return {
    items: items.map((item) => presentMessageForActor(item, chat, actor)),
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function sendMessage(disputeId, payload, actor, requestMeta = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  const role = assertChatAccess(chat, actor);

  const dispute = await Dispute.findById(chat.dispute);
  if (!dispute) {
    throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  }
  assertChatWritable(chat, dispute);

  if (role !== DISPUTE_CHAT_ROLES.ADMIN) {
    await assertNotMuted(chat, actor);
  }
  await assertRateLimit(chat, actor);

  const body = String(payload.body || '').trim();
  if (!body) {
    throw new AppError('Message body is required', 400, { code: 'VALIDATION_ERROR' });
  }

  let attachments;
  try {
    // Evidence screenshots are always stored. OCR may flag for admin review
    // but never auto-rejects screenshot content.
    attachments = await processAttachments(payload.attachments || []);
  } catch (error) {
    if (error instanceof AppError && error.code === 'ATTACHMENT_REJECTED') {
      await writeAudit({
        chat,
        dispute: chat.dispute,
        order: chat.order,
        actor,
        action: DISPUTE_CHAT_AUDIT_ACTIONS.ATTACHMENT_REJECTED,
        meta: error.details || {},
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });
    }
    throw error;
  }

  // Only TEXT chat messages are auto-blocked. Screenshots are never blocked.
  const detection = detectBlockedContent(body);

  if (detection.blocked) {
    const { actionTaken, violation } = await recordViolation({
      chat,
      dispute,
      actor,
      role,
      originalMessage: body,
      rules: detection.rules,
      attachments: payload.attachments || [],
      requestMeta,
    });

    throw new AppError(CONTACT_FILTER_MESSAGE, 400, {
      code: CONTACT_FILTER_CODE,
      details: {
        rules: detection.rules,
        actionTaken,
        violationCount: violation.count,
        mutedUntil: violation.mutedUntil,
        adminNotified: violation.adminNotified,
      },
    });
  }

  const hasFlaggedAttachments = attachments.some((a) => a.flaggedForReview);

  const message = await DisputeChatMessage.create({
    chat: chat._id,
    dispute: chat.dispute,
    order: chat.order,
    author: actorId(actor),
    role,
    body,
    attachments,
    hasFlaggedAttachments,
    moderatorWarningBadge: hasFlaggedAttachments,
  });

  chat.messageCount = (chat.messageCount || 0) + 1;
  chat.lastMessageAt = new Date();
  await chat.save();

  // Keep legacy embedded messages in sync for backward-compatible dispute payloads
  dispute.messages.push({
    author: actorId(actor),
    role,
    body,
    attachments: attachments.map((a) => a.url),
  });
  if (dispute.status === DISPUTE_STATUS.OPEN && role === DISPUTE_CHAT_ROLES.ADMIN) {
    dispute.status = DISPUTE_STATUS.UNDER_REVIEW;
  }
  await dispute.save();

  await writeAudit({
    chat,
    dispute: chat.dispute,
    order: chat.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.MESSAGE_SENT,
    message,
    meta: { role, hasFlaggedAttachments },
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  if (hasFlaggedAttachments) {
    const flaggedCount = attachments.filter((a) => a.flaggedForReview).length;
    dispute.ocrFlagCount = (dispute.ocrFlagCount || 0) + flaggedCount;
    await dispute.save();

    await writeAudit({
      chat,
      dispute: chat.dispute,
      order: chat.order,
      actor,
      action: DISPUTE_CHAT_AUDIT_ACTIONS.ATTACHMENT_FLAGGED,
      message,
      meta: {
        findings: attachments
          .filter((a) => a.flaggedForReview)
          .map((a) => ({ url: a.url, rules: a.ocrFindings })),
      },
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });

    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: chat.order,
      event: DISPUTE_TIMELINE_EVENTS.OCR_FLAGGED,
      actor,
      role,
      message: 'Evidence screenshot flagged for admin OCR review',
      meta: {
        messageId: message._id,
        count: flaggedCount,
        findings: attachments
          .filter((a) => a.flaggedForReview)
          .flatMap((a) => a.ocrFindings || []),
      },
    });

    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: chat.order,
      event: DISPUTE_TIMELINE_EVENTS.EVIDENCE_UPLOADED,
      actor,
      role,
      message: 'Evidence uploaded with OCR review flags',
      meta: { messageId: message._id, flagged: true },
    });
  } else if (attachments.length) {
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: chat.order,
      event: DISPUTE_TIMELINE_EVENTS.EVIDENCE_UPLOADED,
      actor,
      role,
      message: 'Evidence uploaded',
      meta: { messageId: message._id, count: attachments.length },
    });
  }

  return presentMessageForActor(message, chat, actor);
}

export async function editMessage(disputeId, messageId, payload, actor, requestMeta = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  assertChatAccess(chat, actor);
  assertChatWritable(chat);
  await assertNotMuted(chat, actor);

  const message = await DisputeChatMessage.findOne({
    _id: messageId,
    chat: chat._id,
    status: DISPUTE_CHAT_MESSAGE_STATUS.VISIBLE,
  });
  if (!message) {
    throw new AppError('Message not found', 404, { code: 'MESSAGE_NOT_FOUND' });
  }
  if (String(message.author) !== String(actorId(actor)) && !isSuperAdmin(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const body = String(payload.body || '').trim();
  const detection = detectBlockedContent(body);
  if (detection.blocked) {
    const role = resolveParticipantRole(chat, actor);
    const { actionTaken, violation } = await recordViolation({
      chat,
      dispute: chat.dispute,
      actor,
      role,
      originalMessage: body,
      rules: detection.rules,
      attachments: [],
      requestMeta,
    });
    throw new AppError(CONTACT_FILTER_MESSAGE, 400, {
      code: CONTACT_FILTER_CODE,
      details: {
        rules: detection.rules,
        actionTaken,
        violationCount: violation.count,
      },
    });
  }

  message.body = body;
  message.editedAt = new Date();
  await message.save();

  await writeAudit({
    chat,
    dispute: chat.dispute,
    order: chat.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.MESSAGE_EDITED,
    message,
    meta: {},
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  return message.toObject();
}

export async function deleteMessage(disputeId, messageId, actor, requestMeta = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  assertChatAccess(chat, actor);
  assertChatWritable(chat);

  const message = await DisputeChatMessage.findOne({
    _id: messageId,
    chat: chat._id,
    status: DISPUTE_CHAT_MESSAGE_STATUS.VISIBLE,
  });
  if (!message) {
    throw new AppError('Message not found', 404, { code: 'MESSAGE_NOT_FOUND' });
  }

  const isAuthor = String(message.author) === String(actorId(actor));
  const isAssigned = chat.assignedAdmin && String(chat.assignedAdmin) === String(actorId(actor));
  if (!isAuthor && !isAssigned && !isSuperAdmin(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  message.status = DISPUTE_CHAT_MESSAGE_STATUS.DELETED;
  message.deletedAt = new Date();
  message.deletedBy = actorId(actor);
  await message.save();

  await writeAudit({
    chat,
    dispute: chat.dispute,
    order: chat.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.MESSAGE_DELETED,
    message,
    meta: {},
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  return { deleted: true, id: message._id };
}

export async function assignAdmin(disputeId, actor, requestMeta = {}) {
  if (!isStaffAdmin(actor)) {
    throw new AppError('Only admins can be assigned as moderators', 403, { code: 'FORBIDDEN' });
  }

  const chat = await DisputeChat.findOne({ dispute: disputeId });
  if (!chat) {
    throw new AppError('Dispute chat not found', 404, { code: 'CHAT_NOT_FOUND' });
  }

  if (chat.assignedAdmin && String(chat.assignedAdmin) !== String(actorId(actor)) && !isSuperAdmin(actor)) {
    throw new AppError('A moderator is already assigned to this chat', 409, {
      code: 'ADMIN_ALREADY_ASSIGNED',
      details: { assignedAdmin: chat.assignedAdmin },
    });
  }

  chat.assignedAdmin = actorId(actor);
  chat.assignedAt = new Date();
  await chat.save();

  await Dispute.findByIdAndUpdate(disputeId, {
    assignedAdmin: actorId(actor),
    assignedAt: chat.assignedAt,
  });

  await writeAudit({
    chat,
    dispute: chat.dispute,
    order: chat.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.ADMIN_ASSIGNED,
    meta: { assignedAdmin: actorId(actor) },
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  return chat.toObject();
}

export async function listBlockedAttempts(disputeId, query, actor) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  if (!chat) {
    throw new AppError('Dispute chat not found', 404, { code: 'CHAT_NOT_FOUND' });
  }

  const id = String(actorId(actor));
  const allowed = isSuperAdmin(actor)
    || (chat.assignedAdmin && String(chat.assignedAdmin) === id);
  if (!allowed) {
    // Allow staff to assign first, but blocked attempts only for assigned/super
    if (isStaffAdmin(actor)) {
      throw new AppError('Only the assigned admin can view blocked attempts', 403, {
        code: 'ADMIN_NOT_ASSIGNED',
      });
    }
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = { chat: chat._id };
  const [items, total] = await Promise.all([
    DisputeChatBlockedAttempt.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email roles status')
      .lean(),
    DisputeChatBlockedAttempt.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function listAuditLogs(disputeId, query, actor) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  if (!chat) {
    throw new AppError('Dispute chat not found', 404, { code: 'CHAT_NOT_FOUND' });
  }

  const id = String(actorId(actor));
  const allowed = isSuperAdmin(actor)
    || (chat.assignedAdmin && String(chat.assignedAdmin) === id);
  if (!allowed) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = { chat: chat._id };
  const [items, total] = await Promise.all([
    DisputeChatAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name email roles')
      .lean(),
    DisputeChatAuditLog.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function listViolations(query, actor) {
  if (!isStaffAdmin(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.adminNotified === 'true') filter.adminNotified = true;
  if (query.userId) filter.user = query.userId;

  const [items, total] = await Promise.all([
    DisputeChatViolation.find(filter)
      .sort({ count: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email roles status')
      .lean(),
    DisputeChatViolation.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function closeChatForDispute(disputeId, { session = null } = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId }).session(session || null);
  if (!chat) return null;
  chat.status = DISPUTE_CHAT_STATUS.CLOSED;
  chat.closedAt = new Date();
  if (session) await chat.save({ session });
  else await chat.save();
  return chat;
}

/**
 * Mark chat read-only when dispute is resolved/closed.
 * Optionally schedule credential expiry (default 30 days from open/resolve).
 */
export async function setChatReadOnly(disputeId, {
  session = null,
  expireCredentials = false,
} = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId }).session(session || null);
  if (!chat) return null;

  chat.status = DISPUTE_CHAT_STATUS.READ_ONLY;
  chat.readOnlyAt = new Date();
  if (expireCredentials && !chat.credentialsExpireAt) {
    chat.credentialsExpireAt = new Date(
      Date.now() + (env.DISPUTE_CREDENTIAL_TTL_DAYS || 30) * 24 * 60 * 60 * 1000,
    );
  }
  if (session) await chat.save({ session });
  else await chat.save();

  await disputeTimelineService.appendTimelineEvent({
    disputeId,
    orderId: chat.order,
    event: DISPUTE_TIMELINE_EVENTS.CHAT_READ_ONLY,
    actor: null,
    role: 'system',
    message: 'Dispute chat set to read-only',
    meta: { credentialsExpireAt: chat.credentialsExpireAt },
    session,
  });

  return chat;
}

/**
 * Share structured credentials (username/password/OTP/keys) — encrypted at rest, masked in chat.
 * Free-text contact channels remain blocked; this is the only supported credential path.
 */
export async function sendCredentials(disputeId, payload, actor, requestMeta = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  const role = assertChatAccess(chat, actor);
  const dispute = await Dispute.findById(chat.dispute);
  if (!dispute) throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  assertChatWritable(chat, dispute);

  if (role !== DISPUTE_CHAT_ROLES.ADMIN) {
    await assertNotMuted(chat, actor);
  }
  await assertRateLimit(chat, actor);

  const body = String(payload.body || 'Shared secure credentials').trim();
  const noteScan = detectBlockedContent(body);
  if (noteScan.blocked) {
    throw new AppError(CONTACT_FILTER_MESSAGE, 400, {
      code: CONTACT_FILTER_CODE,
      details: { rules: noteScan.rules },
    });
  }

  const { encrypted, masked } = encryptSensitiveObject(payload.credentials || {});
  if (!Object.keys(encrypted).length) {
    throw new AppError('At least one credential field is required', 400, {
      code: 'VALIDATION_ERROR',
    });
  }

  const expireAt = chat.credentialsExpireAt || new Date(
    Date.now() + (env.DISPUTE_CREDENTIAL_TTL_DAYS || 30) * 24 * 60 * 60 * 1000,
  );

  const message = await DisputeChatMessage.create({
    chat: chat._id,
    dispute: chat.dispute,
    order: chat.order,
    author: actorId(actor),
    role,
    body,
    attachments: [],
    hasCredentials: true,
    credentialsEncrypted: encrypted,
    credentialsMasked: masked,
    credentialsExpireAt: expireAt,
  });

  chat.messageCount = (chat.messageCount || 0) + 1;
  chat.lastMessageAt = new Date();
  if (!chat.credentialsExpireAt) chat.credentialsExpireAt = expireAt;
  await chat.save();

  await writeAudit({
    chat,
    dispute: chat.dispute,
    order: chat.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.CREDENTIAL_SHARED,
    message,
    meta: redactForLogs({ fields: Object.keys(masked) }),
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  return presentMessageForActor(message, chat, actor);
}

/**
 * Reveal encrypted credentials for authorized participants only. Fully audited.
 */
export async function revealCredentials(disputeId, messageId, actor, requestMeta = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  assertChatAccess(chat, actor);

  const message = await DisputeChatMessage.findOne({
    _id: messageId,
    chat: chat._id,
    status: DISPUTE_CHAT_MESSAGE_STATUS.VISIBLE,
  });
  if (!message) {
    throw new AppError('Message not found', 404, { code: 'MESSAGE_NOT_FOUND' });
  }
  if (!message.hasCredentials) {
    throw new AppError('Message has no credentials', 400, { code: 'NO_CREDENTIALS' });
  }
  if (
    message.credentialsExpired
    || (message.credentialsExpireAt && message.credentialsExpireAt < new Date())
  ) {
    throw new AppError('Credentials have expired', 410, { code: 'CREDENTIALS_EXPIRED' });
  }

  const revealed = decryptSensitiveObject(message.credentialsEncrypted || {});

  await writeAudit({
    chat,
    dispute: chat.dispute,
    order: chat.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.CREDENTIAL_REVEALED,
    message,
    meta: { fields: Object.keys(revealed), source: 'chat_message' },
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  await disputeTimelineService.appendTimelineEvent({
    disputeId: chat.dispute,
    orderId: chat.order,
    event: DISPUTE_TIMELINE_EVENTS.CREDENTIAL_REVEALED,
    actor,
    role: resolveParticipantRole(chat, actor) || 'participant',
    message: 'Credentials revealed',
    meta: { messageId, fields: Object.keys(revealed) },
  });

  return {
    messageId: message._id,
    credentials: revealed,
    masked: message.credentialsMasked,
  };
}

/**
 * Expire encrypted credential blobs after TTL. Audit logs remain.
 */
export async function expireDueCredentials({ limit = 500 } = {}) {
  const now = new Date();
  const messages = await DisputeChatMessage.find({
    hasCredentials: true,
    credentialsExpired: false,
    credentialsExpireAt: { $lte: now },
  }).limit(limit);

  let expiredMessages = 0;
  for (const message of messages) {
    message.credentialsExpired = true;
    message.credentialsEncrypted = null;
    await message.save();
    expiredMessages += 1;
    await writeAudit({
      chat: message.chat,
      dispute: message.dispute,
      order: message.order,
      actor: null,
      action: DISPUTE_CHAT_AUDIT_ACTIONS.CREDENTIAL_EXPIRED,
      message,
      meta: { source: 'ttl_job' },
    });
  }

  const replacements = await DisputeReplacement.find({
    credentialsExpired: false,
    credentialsExpireAt: { $lte: now },
  }).limit(limit);

  let expiredReplacements = 0;
  for (const replacement of replacements) {
    for (const account of replacement.accounts || []) {
      account.encrypted = {
        username: null,
        email: null,
        password: null,
        otp: null,
        recoveryCode: null,
        backupCode: null,
        twoFactorRecoveryCode: null,
        secretKey: null,
        licenseKey: null,
        apiKey: null,
        recoveryEmail: null,
        recoveryPhone: null,
      };
    }
    replacement.credentialsExpired = true;
    await replacement.save();
    expiredReplacements += 1;
  }

  return { expiredMessages, expiredReplacements };
}

function assertModeratorAccess(chat, actor) {
  if (!chat) {
    throw new AppError('Dispute chat not found', 404, { code: 'CHAT_NOT_FOUND' });
  }
  if (!canViewModeratorSignals(chat, actor)) {
    throw new AppError('Only the assigned admin can review flagged attachments', 403, {
      code: 'ADMIN_NOT_ASSIGNED',
    });
  }
}

export async function listFlaggedAttachments(disputeId, query, actor) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  assertModeratorAccess(chat, actor);

  const { page, limit, skip } = parsePagination(query);
  const filter = {
    chat: chat._id,
    hasFlaggedAttachments: true,
    status: DISPUTE_CHAT_MESSAGE_STATUS.VISIBLE,
  };

  const [messages, total] = await Promise.all([
    DisputeChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email roles')
      .lean(),
    DisputeChatMessage.countDocuments(filter),
  ]);

  const items = messages.flatMap((message) =>
    (message.attachments || [])
      .filter((attachment) => attachment.flaggedForReview)
      .map((attachment) => ({
        messageId: message._id,
        attachmentId: attachment._id,
        author: message.author,
        bodyPreview: String(message.body || '').slice(0, 200),
        warningBadge: true,
        attachment,
        createdAt: message.createdAt,
      })),
  );

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function reviewFlaggedAttachment(
  disputeId,
  messageId,
  attachmentId,
  payload,
  actor,
  requestMeta = {},
) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  assertModeratorAccess(chat, actor);

  const decision = payload?.decision;
  if (![
    DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS.CLEARED,
    DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS.CONFIRMED_VIOLATION,
  ].includes(decision)) {
    throw new AppError('Invalid review decision', 400, { code: 'INVALID_REVIEW_DECISION' });
  }

  const message = await DisputeChatMessage.findOne({
    _id: messageId,
    chat: chat._id,
  });
  if (!message) {
    throw new AppError('Message not found', 404, { code: 'MESSAGE_NOT_FOUND' });
  }

  const attachment = message.attachments.id(attachmentId);
  if (!attachment) {
    throw new AppError('Attachment not found', 404, { code: 'ATTACHMENT_NOT_FOUND' });
  }

  attachment.adminReviewStatus = decision;
  attachment.reviewedAt = new Date();
  attachment.reviewedBy = actorId(actor);
  attachment.reviewNote = payload.note || null;
  // Keep warning badge until cleared; confirmed violations keep badge for history
  if (decision === DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS.CLEARED) {
    attachment.warningBadge = false;
    attachment.flaggedForReview = false;
  }

  message.hasFlaggedAttachments = message.attachments.some((a) => a.flaggedForReview);
  message.moderatorWarningBadge = message.hasFlaggedAttachments;
  await message.save();

  await writeAudit({
    chat,
    dispute: chat.dispute,
    order: chat.order,
    actor,
    action: DISPUTE_CHAT_AUDIT_ACTIONS.ATTACHMENT_REVIEWED,
    message,
    meta: {
      attachmentId,
      decision,
      note: payload.note || null,
      ocrFindings: attachment.ocrFindings,
    },
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  if (decision === DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS.CONFIRMED_VIOLATION) {
    await logActivity({
      userId: actorId(actor),
      action: 'dispute_chat.attachment_confirmed_violation',
      resource: 'DisputeChatMessage',
      resourceId: message._id,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      meta: {
        disputeId: chat.dispute,
        attachmentId,
        authorId: message.author,
        ocrFindings: attachment.ocrFindings,
      },
    });
  }

  return presentMessageForActor(message, chat, actor);
}

export default {
  createDisputeChat,
  getChatByDisputeId,
  getDisputeChat,
  listMessages,
  sendMessage,
  sendCredentials,
  revealCredentials,
  editMessage,
  deleteMessage,
  assignAdmin,
  listBlockedAttempts,
  listAuditLogs,
  listViolations,
  listFlaggedAttachments,
  reviewFlaggedAttachment,
  closeChatForDispute,
  setChatReadOnly,
  expireDueCredentials,
  assertChatAccess,
};
