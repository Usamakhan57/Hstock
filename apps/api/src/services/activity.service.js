import { ActivityLog } from '../models/index.js';
import { isHiddenActivityAction } from '../constants/notifications.js';

/** Mongo regex that matches auth / audit / debug activity actions. */
export const HIDDEN_ACTIVITY_ACTION_REGEX = /^(auth\.|users\.password\.|users\.login\.|users\.logout\.|system\.debug\.|system\.audit\.|developer\.)/i;

export async function logActivity({
  userId = null,
  action,
  resource = null,
  resourceId = null,
  ip = null,
  userAgent = null,
  meta = {},
  session = null,
} = {}) {
  const doc = {
    user: userId,
    action,
    resource,
    resourceId: resourceId ? String(resourceId) : null,
    ip,
    userAgent,
    meta,
  };

  if (session) {
    await ActivityLog.create([doc], { session });
    return;
  }

  await ActivityLog.create(doc);
}

export async function listActivityLogs({
  userId,
  page = 1,
  limit = 20,
  excludeHidden = false,
} = {}) {
  const filter = {};
  if (userId) filter.user = userId;
  if (excludeHidden) {
    filter.action = { $not: HIDDEN_ACTIVITY_ACTION_REGEX };
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return { items, total };
}

export default {
  logActivity,
  listActivityLogs,
  isHiddenActivityAction,
  HIDDEN_ACTIVITY_ACTION_REGEX,
};
