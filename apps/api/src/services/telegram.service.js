import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { enqueue } from '../queues/index.js';
import {
  User,
  TelegramConnectToken,
  TelegramMessageLog,
  TelegramBroadcast,
} from '../models/index.js';
import { TELEGRAM_BROADCAST_CATEGORIES } from '../models/TelegramBroadcast.model.js';

const CONNECT_TOKEN_TTL_MS = 15 * 60 * 1000;
const TELEGRAM_API_BASE = 'https://api.telegram.org';
const MAX_SEND_RETRIES = 3;
const MIN_SEND_INTERVAL_MS = 35; // ~28 msg/s soft rate limit

let lastSendAt = 0;
let pollingTimer = null;
let pollingOffset = 0;
let botInfoCache = null;

function isEnabled() {
  return Boolean(env.TELEGRAM_ENABLED && env.TELEGRAM_BOT_TOKEN);
}

function signingSecret() {
  return env.TELEGRAM_WEBHOOK_SECRET || env.JWT_ACCESS_SECRET;
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function publicTelegramStatus(user) {
  if (!user) {
    return {
      connected: false,
      username: null,
      telegramUserId: null,
      connectedAt: null,
      notificationsEnabled: true,
    };
  }
  return {
    connected: Boolean(user.telegramConnected),
    username: user.telegramUsername || null,
    telegramUserId: user.telegramUserId || null,
    connectedAt: user.telegramConnectedAt || null,
    notificationsEnabled: user.telegramNotificationsEnabled !== false,
  };
}

async function telegramApi(method, body = {}) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new AppError('Telegram bot is not configured', 503, { code: 'TELEGRAM_DISABLED' });
  }

  const elapsed = Date.now() - lastSendAt;
  if (elapsed < MIN_SEND_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_SEND_INTERVAL_MS - elapsed));
  }
  lastSendAt = Date.now();

  const url = `${TELEGRAM_API_BASE}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const message = data.description || `Telegram API ${method} failed`;
      const error = new Error(message);
      error.code = data.error_code || response.status;
      error.retryAfter = data.parameters?.retry_after;
      throw error;
    }
    return data.result;
  } finally {
    clearTimeout(timeout);
  }
}

export function getTelegramConfig() {
  return {
    enabled: isEnabled(),
    mode: env.TELEGRAM_MODE,
    botUsername: env.TELEGRAM_BOT_USERNAME || null,
    webhookConfigured: Boolean(env.TELEGRAM_WEBHOOK_URL),
    hasToken: Boolean(env.TELEGRAM_BOT_TOKEN),
  };
}

export async function getBotStatus() {
  const config = getTelegramConfig();
  if (!isEnabled()) {
    return {
      ...config,
      online: false,
      bot: null,
      reason: env.TELEGRAM_ENABLED ? 'missing_bot_token' : 'disabled',
    };
  }

  try {
    if (!botInfoCache) {
      botInfoCache = await telegramApi('getMe');
    }
    return {
      ...config,
      online: true,
      bot: {
        id: botInfoCache.id,
        username: botInfoCache.username,
        firstName: botInfoCache.first_name,
        canJoinGroups: botInfoCache.can_join_groups,
        canReadAllGroupMessages: botInfoCache.can_read_all_group_messages,
      },
    };
  } catch (error) {
    logger.warn('Telegram getMe failed', { message: error.message });
    return {
      ...config,
      online: false,
      bot: null,
      reason: error.message,
    };
  }
}

export async function createConnectLink(userId) {
  if (!isEnabled()) {
    throw new AppError('Telegram notifications are not enabled', 503, {
      code: 'TELEGRAM_DISABLED',
    });
  }
  if (!env.TELEGRAM_BOT_USERNAME) {
    throw new AppError('Telegram bot username is not configured', 503, {
      code: 'TELEGRAM_BOT_USERNAME_MISSING',
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  // Invalidate previous unused tokens for this user
  await TelegramConnectToken.updateMany(
    { user: userId, usedAt: null },
    { $set: { usedAt: new Date() } },
  );

  const expiresAt = new Date(Date.now() + CONNECT_TOKEN_TTL_MS);
  // Telegram start params: max 64 chars, [A-Za-z0-9_]
  // Signed envelope embeds user binding + expiry; hash stored for one-time use.
  const nonce = crypto.randomBytes(16).toString('hex'); // 32 chars
  const exp = expiresAt.getTime().toString(36);
  const body = `${String(userId)}_${nonce}_${exp}`;
  const sig = crypto
    .createHmac('sha256', signingSecret())
    .update(body)
    .digest('hex')
    .slice(0, 16);
  const rawToken = `${nonce}${sig}`; // 48 chars, well under Telegram's 64 limit

  await TelegramConnectToken.create({
    user: userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  const url = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${rawToken}`;

  return {
    url,
    expiresAt,
    status: publicTelegramStatus(user),
  };
}

/**
 * Official Telegram connection status for a user.
 * Connected iff User.telegramConnected is true (set when bot link completes).
 */
export async function getTelegramConnectionStatus(userId) {
  const user = await User.findById(userId)
    .select('+telegramChatId')
    .lean();
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }
  return publicTelegramStatus(user);
}

/** @deprecated Prefer getTelegramConnectionStatus — same implementation. */
export async function getConnectionStatus(userId) {
  return getTelegramConnectionStatus(userId);
}

export async function updateTelegramSettings(userId, { notificationsEnabled } = {}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }
  if (typeof notificationsEnabled === 'boolean') {
    user.telegramNotificationsEnabled = notificationsEnabled;
    await user.save();
  }
  return publicTelegramStatus(user);
}

export async function disconnectTelegram(userId) {
  const user = await User.findById(userId).select('+telegramChatId');
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  const chatId = user.telegramChatId;
  user.telegramConnected = false;
  user.telegramChatId = undefined;
  user.telegramUserId = undefined;
  user.telegramUsername = null;
  user.telegramConnectedAt = null;
  user.set('telegramChatId', undefined);
  user.set('telegramUserId', undefined);
  await user.save();
  await User.updateOne(
    { _id: userId },
    { $unset: { telegramChatId: 1, telegramUserId: 1 } },
  );

  if (chatId && isEnabled()) {
    try {
      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: 'Your ApnaStore account has been disconnected from Telegram notifications.',
      });
    } catch (error) {
      logger.warn('Failed to notify Telegram disconnect', { message: error.message });
    }
  }

  return publicTelegramStatus(user);
}

async function linkTelegramAccount({
  userId,
  telegramUserId,
  telegramUsername,
  chatId,
  tokenHash,
}) {
  const existing = await User.findOne({
    telegramUserId: String(telegramUserId),
    _id: { $ne: userId },
  }).select('_id email').lean();

  if (existing) {
    throw new AppError(
      'This Telegram account is already linked to another ApnaStore user.',
      409,
      { code: 'TELEGRAM_ALREADY_LINKED' },
    );
  }

  const user = await User.findById(userId).select('+telegramChatId');
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  user.telegramConnected = true;
  user.telegramChatId = String(chatId);
  user.telegramUserId = String(telegramUserId);
  user.telegramUsername = telegramUsername || null;
  user.telegramConnectedAt = new Date();
  user.telegramNotificationsEnabled = true;
  await user.save();

  await TelegramConnectToken.updateOne(
    { tokenHash },
    {
      $set: {
        usedAt: new Date(),
        consumedByTelegramUserId: String(telegramUserId),
      },
    },
  );

  return user;
}

async function handleStartCommand(message) {
  const text = String(message.text || '').trim();
  const parts = text.split(/\s+/);
  const startParam = parts[1];
  const chatId = message.chat?.id;
  const from = message.from;

  if (!startParam) {
    try {
      await telegramApi('sendMessage', {
        chat_id: chatId,
        text: 'Welcome to ApnaStore notifications.\n\nOpen your ApnaStore Profile and tap Connect Telegram to link your account.',
      });
    } catch (error) {
      logger.warn('Telegram welcome message failed', { message: error.message });
    }
    return { ok: true, linked: false };
  }

  const rawToken = String(startParam).trim();
  if (!/^[A-Za-z0-9_]{16,64}$/.test(rawToken)) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: 'This connect link is invalid. Please generate a new one from your ApnaStore Profile.',
    });
    return { ok: false, reason: 'invalid_token_format' };
  }

  const tokenHash = hashToken(rawToken);
  const record = await TelegramConnectToken.findOne({ tokenHash });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: 'This connect link was already used or has expired. Please generate a new one from your ApnaStore Profile.',
    });
    return { ok: false, reason: 'token_replay' };
  }

  // HMAC suffix check binds the opaque token to our signing secret (anti-forgery).
  const nonce = rawToken.slice(0, 32);
  const providedSig = rawToken.slice(32);
  // Reconstruct is not possible without userId/exp in the token; verify via DB + HMAC of stored binding.
  const binding = `${String(record.user)}_${nonce}_${record.expiresAt.getTime().toString(36)}`;
  const expectedSig = crypto
    .createHmac('sha256', signingSecret())
    .update(binding)
    .digest('hex')
    .slice(0, 16);
  const sigA = Buffer.from(providedSig);
  const sigB = Buffer.from(expectedSig);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: 'Connect token validation failed. Please try again from ApnaStore.',
    });
    return { ok: false, reason: 'token_signature_invalid' };
  }

  try {
    const user = await linkTelegramAccount({
      userId: record.user,
      telegramUserId: from.id,
      telegramUsername: from.username || null,
      chatId,
      tokenHash,
    });

    await TelegramMessageLog.create({
      user: user._id,
      chatId: String(chatId),
      kind: 'connect',
      eventType: 'telegram_connected',
      title: 'Telegram connected',
      body: 'Account linked successfully',
      status: 'sent',
      sentAt: new Date(),
    });

    await telegramApi('sendMessage', {
      chat_id: chatId,
      text: `✅ Connected to ApnaStore as ${user.name || user.email}.\n\nYou will receive marketplace notifications here. Manage preferences anytime in your ApnaStore Profile.`,
      parse_mode: 'HTML',
    });

    return { ok: true, linked: true, userId: String(user._id) };
  } catch (error) {
    const msg = error instanceof AppError
      ? error.message
      : 'Could not link your Telegram account. Please try again.';
    await telegramApi('sendMessage', { chat_id: chatId, text: `❌ ${msg}` });
    return { ok: false, reason: error.code || 'link_failed' };
  }
}

export async function processTelegramUpdate(update) {
  if (!update || typeof update !== 'object') {
    return { ok: false, reason: 'invalid_update' };
  }

  const message = update.message || update.edited_message;
  if (!message?.text) {
    return { ok: true, ignored: true };
  }

  if (String(message.text).startsWith('/start')) {
    return handleStartCommand(message);
  }

  if (String(message.text).startsWith('/status')) {
    const linked = await User.findOne({ telegramUserId: String(message.from?.id) })
      .select('name email telegramConnected telegramNotificationsEnabled')
      .lean();
    const text = linked
      ? `Linked to ApnaStore (${linked.name || linked.email}). Notifications: ${linked.telegramNotificationsEnabled !== false ? 'enabled' : 'disabled'}.`
      : 'Not linked. Connect from your ApnaStore Profile.';
    await telegramApi('sendMessage', { chat_id: message.chat.id, text });
    return { ok: true };
  }

  return { ok: true, ignored: true };
}

export function assertWebhookSecret(headerValue) {
  if (!env.TELEGRAM_WEBHOOK_SECRET) {
    if (env.isProduction) {
      throw new AppError('Webhook secret not configured', 503, { code: 'TELEGRAM_WEBHOOK_SECRET_MISSING' });
    }
    return true;
  }
  const provided = String(headerValue || '');
  const expected = String(env.TELEGRAM_WEBHOOK_SECRET);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AppError('Invalid webhook secret', 401, { code: 'TELEGRAM_WEBHOOK_UNAUTHORIZED' });
  }
  return true;
}

function formatTelegramText({ title, body, link }) {
  const lines = [];
  if (title) lines.push(`<b>${escapeHtml(title)}</b>`);
  if (body) lines.push(escapeHtml(body));
  if (link) {
    const absolute = link.startsWith('http')
      ? link
      : `${env.FRONTEND_URL || env.APP_URL}${link.startsWith('/') ? '' : '/'}${link}`;
    lines.push(`\n<a href="${escapeHtml(absolute)}">Open in ApnaStore</a>`);
  }
  return lines.join('\n').slice(0, 3900);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Queue a Telegram notification for a user. Never throws to callers.
 */
export function queueUserTelegramNotification({
  userId,
  title,
  body,
  link = null,
  eventType = 'system',
  notificationId = null,
  meta = {},
}) {
  if (!isEnabled() || !userId) return false;
  try {
    enqueue('telegram', {
      kind: 'notification',
      userId: String(userId),
      title,
      body,
      link,
      eventType,
      notificationId,
      meta,
    });
    return true;
  } catch (error) {
    logger.error('Failed to enqueue Telegram notification', { message: error.message });
    return false;
  }
}

export async function sendDirectMessage({
  chatId,
  text,
  parseMode = 'HTML',
  disablePreview = true,
}) {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    disable_web_page_preview: disablePreview,
  });
}

export async function processTelegramJob(job) {
  const payload = job?.payload || {};
  if (payload.kind === 'broadcast_chunk') {
    return processBroadcastChunk(payload);
  }
  if (payload.kind !== 'notification' && payload.kind !== 'system') {
    return;
  }

  const log = await TelegramMessageLog.create({
    user: payload.userId || null,
    kind: payload.kind === 'system' ? 'system' : 'notification',
    eventType: payload.eventType || null,
    title: payload.title || '',
    body: payload.body || '',
    status: 'queued',
    notification: payload.notificationId || null,
    meta: payload.meta || {},
    attempts: (job.attempts || 0) + 1,
  });

  try {
    if (!isEnabled()) {
      log.status = 'skipped';
      log.error = 'Telegram disabled';
      await log.save();
      return;
    }

    const user = await User.findById(payload.userId)
      .select('+telegramChatId telegramConnected telegramNotificationsEnabled telegramUsername telegramUserId')
      .lean();

    if (!user?.telegramConnected || !user.telegramChatId) {
      log.status = 'skipped';
      log.error = 'User not connected';
      await log.save();
      return;
    }

    if (user.telegramNotificationsEnabled === false && payload.kind !== 'system') {
      log.status = 'skipped';
      log.error = 'Notifications disabled by user';
      await log.save();
      return;
    }

    log.chatId = String(user.telegramChatId);
    const text = formatTelegramText({
      title: payload.title,
      body: payload.body,
      link: payload.link,
    });

    const result = await sendDirectMessage({
      chatId: user.telegramChatId,
      text,
    });

    log.status = 'sent';
    log.telegramMessageId = result?.message_id != null ? String(result.message_id) : null;
    log.sentAt = new Date();
    await log.save();

    await User.updateOne(
      { _id: user._id },
      { $set: { telegramLastNotificationAt: new Date() } },
    );
  } catch (error) {
    log.status = 'failed';
    log.error = String(error.message || error).slice(0, 1000);
    await log.save();
    logger.error('Telegram send failed', {
      message: error.message,
      userId: payload.userId,
      attempts: log.attempts,
    });
    if ((job.attempts || 0) + 1 < MAX_SEND_RETRIES) {
      throw error;
    }
  }
}

export async function createBroadcast({
  title,
  message,
  category = 'general',
  audience = 'connected',
  createdBy,
}) {
  if (!TELEGRAM_BROADCAST_CATEGORIES.includes(category)) {
    throw new AppError('Invalid broadcast category', 400, { code: 'VALIDATION_ERROR' });
  }

  const broadcast = await TelegramBroadcast.create({
    title,
    message,
    category,
    audience,
    createdBy,
    status: 'queued',
  });

  enqueue('telegram', {
    kind: 'broadcast_chunk',
    broadcastId: String(broadcast._id),
  });

  return broadcast.toObject();
}

async function processBroadcastChunk(payload) {
  const broadcast = await TelegramBroadcast.findById(payload.broadcastId);
  if (!broadcast || ['completed', 'cancelled'].includes(broadcast.status)) return;

  broadcast.status = 'sending';
  broadcast.startedAt = broadcast.startedAt || new Date();
  await broadcast.save();

  const filter = {
    telegramConnected: true,
    telegramChatId: { $ne: null },
    telegramNotificationsEnabled: { $ne: false },
  };
  if (broadcast.audience === 'buyers') filter.roles = 'buyer';
  if (broadcast.audience === 'sellers') filter.roles = 'seller';

  const users = await User.find(filter)
    .select('+telegramChatId name email roles')
    .lean();

  broadcast.stats.targeted = users.length;
  await broadcast.save();

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      if (!user.telegramChatId) {
        skipped += 1;
        continue;
      }
      const text = formatTelegramText({
        title: `📢 ${broadcast.title}`,
        body: broadcast.message,
      });
      const result = await sendDirectMessage({
        chatId: user.telegramChatId,
        text,
      });
      await TelegramMessageLog.create({
        user: user._id,
        chatId: String(user.telegramChatId),
        kind: 'broadcast',
        eventType: broadcast.category,
        title: broadcast.title,
        body: broadcast.message,
        status: 'sent',
        telegramMessageId: result?.message_id != null ? String(result.message_id) : null,
        broadcast: broadcast._id,
        sentAt: new Date(),
      });
      sent += 1;
      await User.updateOne(
        { _id: user._id },
        { $set: { telegramLastNotificationAt: new Date() } },
      );
    } catch (error) {
      failed += 1;
      await TelegramMessageLog.create({
        user: user._id,
        kind: 'broadcast',
        eventType: broadcast.category,
        title: broadcast.title,
        body: broadcast.message,
        status: 'failed',
        error: String(error.message || error).slice(0, 1000),
        broadcast: broadcast._id,
      });
      logger.error('Broadcast message failed', {
        broadcastId: String(broadcast._id),
        userId: String(user._id),
        message: error.message,
      });
    }
  }

  broadcast.stats.sent = sent;
  broadcast.stats.failed = failed;
  broadcast.stats.skipped = skipped;
  broadcast.status = failed && !sent ? 'failed' : 'completed';
  broadcast.completedAt = new Date();
  if (failed && !sent) broadcast.error = 'All deliveries failed';
  await broadcast.save();
}

export async function listBroadcasts(query = {}) {
  const pagination = parsePagination(query);
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    TelegramBroadcast.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('createdBy', 'name email')
      .lean(),
    TelegramBroadcast.countDocuments(filter),
  ]);

  return {
    items,
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export async function listMessageLogs(query = {}) {
  const pagination = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.kind) filter.kind = query.kind;
  if (query.eventType) filter.eventType = query.eventType;
  if (query.userId) filter.user = query.userId;

  const [items, total] = await Promise.all([
    TelegramMessageLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('user', 'name email telegramUsername telegramUserId telegramConnected')
      .lean(),
    TelegramMessageLog.countDocuments(filter),
  ]);

  // Never expose chat IDs in admin list responses
  const safeItems = items.map((item) => {
    const { chatId, ...rest } = item;
    return rest;
  });

  return {
    items: safeItems,
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export async function searchConnectedUsers(query = {}) {
  const pagination = parsePagination(query);
  const filter = { telegramConnected: true };
  if (query.search) {
    const q = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [
      { email: q },
      { name: q },
      { telegramUsername: q },
      { telegramUserId: q },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ telegramConnectedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .select('name email roles telegramUsername telegramUserId telegramConnected telegramConnectedAt telegramNotificationsEnabled telegramLastNotificationAt')
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      roles: u.roles,
      telegram: publicTelegramStatus(u),
      lastNotificationAt: u.telegramLastNotificationAt || null,
    })),
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export async function getTelegramStatistics() {
  const [
    connectedUsers,
    notificationsEnabled,
    sent,
    failed,
    skipped,
    broadcasts,
    recentLogs,
  ] = await Promise.all([
    User.countDocuments({ telegramConnected: true }),
    User.countDocuments({ telegramConnected: true, telegramNotificationsEnabled: true }),
    TelegramMessageLog.countDocuments({ status: 'sent' }),
    TelegramMessageLog.countDocuments({ status: 'failed' }),
    TelegramMessageLog.countDocuments({ status: 'skipped' }),
    TelegramBroadcast.countDocuments({}),
    TelegramMessageLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email telegramUsername')
      .lean(),
  ]);

  const status = await getBotStatus();

  return {
    bot: status,
    connectedUsers,
    notificationsEnabled,
    messagesSent: sent,
    messagesFailed: failed,
    messagesSkipped: skipped,
    broadcasts,
    recentLogs: recentLogs.map(({ chatId, ...rest }) => rest),
  };
}

export async function setupWebhook() {
  if (!isEnabled()) return { configured: false, reason: 'disabled' };
  if (env.TELEGRAM_MODE !== 'webhook') {
    return { configured: false, reason: 'polling_mode' };
  }
  if (!env.TELEGRAM_WEBHOOK_URL) {
    logger.warn('TELEGRAM_WEBHOOK_URL missing; webhook not set');
    return { configured: false, reason: 'missing_webhook_url' };
  }

  try {
    const result = await telegramApi('setWebhook', {
      url: env.TELEGRAM_WEBHOOK_URL,
      secret_token: env.TELEGRAM_WEBHOOK_SECRET || undefined,
      drop_pending_updates: false,
      allowed_updates: ['message'],
    });
    logger.info('Telegram webhook configured', { url: env.TELEGRAM_WEBHOOK_URL });
    return { configured: true, result };
  } catch (error) {
    logger.error('Failed to set Telegram webhook', { message: error.message });
    return { configured: false, reason: error.message };
  }
}

export async function startPolling() {
  if (!isEnabled() || env.TELEGRAM_MODE !== 'polling') {
    return { started: false };
  }
  if (pollingTimer) return { started: true, already: true };

  // Clear webhook so polling works in development
  try {
    await telegramApi('deleteWebhook', { drop_pending_updates: false });
  } catch (error) {
    logger.warn('deleteWebhook failed', { message: error.message });
  }

  const poll = async () => {
    try {
      const updates = await telegramApi('getUpdates', {
        offset: pollingOffset,
        timeout: 20,
        allowed_updates: ['message'],
      });
      for (const update of updates || []) {
        pollingOffset = Math.max(pollingOffset, (update.update_id || 0) + 1);
        // eslint-disable-next-line no-await-in-loop
        await processTelegramUpdate(update);
      }
    } catch (error) {
      logger.warn('Telegram polling error', { message: error.message });
    }
  };

  pollingTimer = setInterval(poll, 1000);
  if (typeof pollingTimer.unref === 'function') pollingTimer.unref();
  void poll();
  logger.info('Telegram polling started');
  return { started: true };
}

export function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

export async function initializeTelegram() {
  if (!env.TELEGRAM_ENABLED) {
    logger.info('Telegram integration disabled');
    return { enabled: false };
  }
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.warn('TELEGRAM_ENABLED=true but TELEGRAM_BOT_TOKEN is missing');
    return { enabled: false, reason: 'missing_token' };
  }

  if (env.TELEGRAM_MODE === 'webhook') {
    await setupWebhook();
  } else if (!env.isTest) {
    await startPolling();
  }

  const status = await getBotStatus();
  logger.info('Telegram initialized', {
    mode: env.TELEGRAM_MODE,
    online: status.online,
    username: status.bot?.username || env.TELEGRAM_BOT_USERNAME,
  });
  return status;
}

export {
  publicTelegramStatus,
  isEnabled as isTelegramEnabled,
  hashToken,
  formatTelegramText,
};

export default {
  getTelegramConfig,
  getBotStatus,
  createConnectLink,
  getConnectionStatus,
  getTelegramConnectionStatus,
  updateTelegramSettings,
  disconnectTelegram,
  processTelegramUpdate,
  assertWebhookSecret,
  queueUserTelegramNotification,
  sendDirectMessage,
  processTelegramJob,
  createBroadcast,
  listBroadcasts,
  listMessageLogs,
  searchConnectedUsers,
  getTelegramStatistics,
  setupWebhook,
  startPolling,
  stopPolling,
  initializeTelegram,
  publicTelegramStatus,
  isTelegramEnabled: isEnabled,
};
