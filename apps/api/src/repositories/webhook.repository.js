import { WebhookEvent } from '../models/index.js';
import { WEBHOOK_EVENT_STATUS } from '../constants/statuses.js';
import { withSession } from './base.repository.js';

export async function createWebhookEvent(data, session = null) {
  const [doc] = await WebhookEvent.create([data], withSession(session));
  return doc;
}

export async function findWebhookByEventKey(eventKey, { session = null, lean = false } = {}) {
  let query = WebhookEvent.findOne({ eventKey });
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function updateWebhookById(id, update, session = null) {
  return WebhookEvent.findByIdAndUpdate(id, update, { new: true, ...withSession(session) });
}

export async function findFailedWebhooks(limit = 50) {
  return WebhookEvent.find({
    status: { $in: [WEBHOOK_EVENT_STATUS.FAILED, WEBHOOK_EVENT_STATUS.RECEIVED] },
    attempts: { $lt: 10 },
  })
    .sort({ updatedAt: 1 })
    .limit(limit);
}

export default {
  createWebhookEvent,
  findWebhookByEventKey,
  updateWebhookById,
  findFailedWebhooks,
};
