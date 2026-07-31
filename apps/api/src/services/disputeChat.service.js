import {
  Dispute,
  DisputeChat,
  DisputeChatMessage,
  DisputeChatBlockedAttempt,
  DisputeChatAuditLog,
  DisputeChatViolation,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES } from '../constants/roles.js';
import {
  CONTACT_FILTER_CODE,
  CONTACT_FILTER_MESSAGE,
  DISPUTE_CHAT_AUDIT_ACTIONS,
  DISPUTE_CHAT_MESSAGE_STATUS,
  DISPUTE_CHAT_MUTE_DURATION_MS,
  DISPUTE_CHAT_RATE_LIMIT,
  DISPUTE_CHAT_ROLES,
  DISPUTE_CHAT_STATUS,
  DISPUTE_CHAT_VIOLATION_THRESHOLDS,
} from '../constants/disputeChat.js';
import { DISPUTE_STATUS } from '../constants/statuses.js';
import {
  detectBlockedContent,
  validateChatAttachment,
} from '../helpers/contentFilter.helper.js';
import { logActivity } from './activity.service.js';

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

function normalizeAttachments(attachments = []) {
  if (!attachments?.length) return [];
  const normalized = [];
  for (const item of attachments) {
    const url = typeof item === 'string' ? item : item?.url;
    const check = validateChatAttachment(url);
    if (!check.ok) {
      throw new AppError('Attachment type is not allowed', 400, {
        code: 'ATTACHMENT_REJECTED',
        details: { reason: check.reason, extension: check.extension, url },
      });
    }
    let filename = null;
    try {
      filename = new URL(url).pathname.split('/').pop() || null;
    } catch {
      filename = String(url).split('/').pop() || null;
    }
    normalized.push({
      url,
      filename,
      extension: check.extension,
    });
  }
  return normalized;
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

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function sendMessage(disputeId, payload, actor, requestMeta = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  const role = assertChatAccess(chat, actor);

  if (chat.status === DISPUTE_CHAT_STATUS.CLOSED) {
    throw new AppError('Dispute chat is closed', 400, { code: 'CHAT_CLOSED' });
  }

  const dispute = await Dispute.findById(chat.dispute);
  if (!dispute) {
    throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  }
  if ([DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.status)) {
    throw new AppError('Dispute is closed', 400, { code: 'DISPUTE_CLOSED' });
  }

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
    attachments = normalizeAttachments(payload.attachments || []);
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

  // Scan message body only. Attachment URLs are validated via allowlist
  // (images/pdf/zip/txt) — hosting URLs themselves are not treated as contact leaks.
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

  const message = await DisputeChatMessage.create({
    chat: chat._id,
    dispute: chat.dispute,
    order: chat.order,
    author: actorId(actor),
    role,
    body,
    attachments,
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
    meta: { role },
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  return message.toObject();
}

export async function editMessage(disputeId, messageId, payload, actor, requestMeta = {}) {
  const chat = await DisputeChat.findOne({ dispute: disputeId });
  assertChatAccess(chat, actor);
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

export default {
  createDisputeChat,
  getChatByDisputeId,
  getDisputeChat,
  listMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  assignAdmin,
  listBlockedAttempts,
  listAuditLogs,
  listViolations,
  closeChatForDispute,
  assertChatAccess,
};
