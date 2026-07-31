import { get, post, patch, del } from '../lib/apiClient';
import {
  mapBackendDispute,
  mapDisputeDashboard,
  mapTimelineEvent,
  mapChatMessage,
  mapReplacement,
} from '../lib/mappers/disputeMappers';
import { cacheKey, cachedRequest, clearRequestCache } from '../lib/requestCache';

function clearDisputeCaches() {
  clearRequestCache('disputes');
  clearRequestCache('dispute');
  clearRequestCache('dispute-chat');
  clearRequestCache('orders');
}

export const disputesApi = {
  async open({
    orderId,
    reason,
    description,
    evidence,
    disputedQuantity,
    disputedAccountIds,
  }) {
    const body = { orderId, reason, description };
    if (evidence?.length) body.evidence = evidence;
    if (disputedQuantity != null) body.disputedQuantity = Number(disputedQuantity);
    if (disputedAccountIds?.length) body.disputedAccountIds = disputedAccountIds;
    const { data, message } = await post('/disputes', body);
    clearDisputeCaches();
    return { dispute: mapBackendDispute(data), message };
  },

  async list({ page = 1, limit = 20, status, scope } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (scope) params.scope = scope;
    const key = cacheKey('disputes', params);
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/disputes', { params });
      const items = Array.isArray(data) ? data.map(mapBackendDispute) : [];
      return { items, meta };
    }, 8_000);
  },

  async get(id) {
    const key = cacheKey('dispute', { id });
    return cachedRequest(key, async () => {
      const { data } = await get(`/disputes/${id}`);
      return mapBackendDispute(data);
    }, 4_000);
  },

  async dashboard(id) {
    const key = cacheKey('dispute', { id, view: 'dashboard' });
    return cachedRequest(key, async () => {
      const { data } = await get(`/disputes/${id}/dashboard`);
      return mapDisputeDashboard(data);
    }, 4_000);
  },

  async timeline(id) {
    const { data } = await get(`/disputes/${id}/timeline`);
    const items = Array.isArray(data) ? data.map(mapTimelineEvent) : [];
    return { items };
  },

  async listReplacements(id) {
    const { data } = await get(`/disputes/${id}/replacements`);
    const items = Array.isArray(data) ? data.map(mapReplacement) : [];
    return { items };
  },

  async sendReplacement(id, { notes, accounts }) {
    const { data, message } = await post(`/disputes/${id}/replacements`, { notes, accounts });
    clearDisputeCaches();
    return { replacement: mapReplacement(data), message };
  },

  async respondReplacement(id, replacementId, { decision, note }) {
    const { data, message } = await post(
      `/disputes/${id}/replacements/${replacementId}/respond`,
      { decision, note },
    );
    clearDisputeCaches();
    return { replacement: mapReplacement(data), message };
  },

  async revealReplacementCredentials(id, replacementId, accountId) {
    const { data } = await post(
      `/disputes/${id}/replacements/${replacementId}/accounts/${accountId}/reveal`,
      {},
    );
    return data;
  },

  async getChat(id) {
    const { data } = await get(`/disputes/${id}/chat`);
    return data;
  },

  async listMessages(id, { page = 1, limit = 50 } = {}) {
    const params = { page, limit };
    const { data, meta } = await get(`/disputes/${id}/chat/messages`, { params });
    const items = Array.isArray(data) ? data.map(mapChatMessage) : [];
    return { items, meta };
  },

  async sendMessage(id, { body, attachments }) {
    const payload = { body };
    if (attachments?.length) payload.attachments = attachments;
    const { data, message } = await post(`/disputes/${id}/chat/messages`, payload);
    clearRequestCache('dispute-chat');
    return { message: mapChatMessage(data), apiMessage: message };
  },

  async sendCredentials(id, { body, credentials }) {
    const { data, message } = await post(`/disputes/${id}/chat/credentials`, {
      body: body || 'Shared secure credentials',
      credentials,
    });
    clearRequestCache('dispute-chat');
    return { message: mapChatMessage(data), apiMessage: message };
  },

  async revealCredentials(id, messageId) {
    const { data } = await post(`/disputes/${id}/chat/messages/${messageId}/reveal`, {});
    return data;
  },

  async editMessage(id, messageId, body) {
    const { data } = await patch(`/disputes/${id}/chat/messages/${messageId}`, { body });
    clearRequestCache('dispute-chat');
    return mapChatMessage(data);
  },

  async deleteMessage(id, messageId) {
    const { data } = await del(`/disputes/${id}/chat/messages/${messageId}`);
    clearRequestCache('dispute-chat');
    return mapChatMessage(data);
  },

  /** Legacy message endpoint — still applies secure filters. */
  async addLegacyMessage(id, { body, attachments }) {
    const payload = { body };
    if (attachments?.length) payload.attachments = attachments;
    const { data, message } = await post(`/disputes/${id}/messages`, payload);
    clearDisputeCaches();
    return { message: mapChatMessage(data), apiMessage: message };
  },
};

export default disputesApi;
