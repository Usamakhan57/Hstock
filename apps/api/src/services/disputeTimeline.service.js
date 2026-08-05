import { DisputeTimeline } from '../models/index.js';
import { redactForLogs } from '../utils/credentials.crypto.js';

export async function appendTimelineEvent({
  disputeId,
  orderId = null,
  event,
  actor = null,
  role = null,
  message = '',
  meta = {},
  session = null,
}) {
  const doc = {
    dispute: disputeId,
    order: orderId,
    event,
    actor: actor?.id || actor?._id || null,
    role,
    message,
    meta: redactForLogs(meta) || {},
  };
  if (session) {
    const [created] = await DisputeTimeline.create([doc], { session });
    return created;
  }
  return DisputeTimeline.create(doc);
}

export async function listTimeline(disputeId) {
  return DisputeTimeline.find({ dispute: disputeId })
    .sort({ createdAt: 1 })
    .populate('actor', 'name email roles')
    .lean();
}

export default {
  appendTimelineEvent,
  listTimeline,
};
