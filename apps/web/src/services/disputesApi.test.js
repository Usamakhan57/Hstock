import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../lib/requestCache', () => ({
  cacheKey: (...parts) => parts.map(String).join(':'),
  cachedRequest: (_key, fn) => fn(),
  clearRequestCache: vi.fn(),
}));

import { get, post } from '../lib/apiClient';
import { disputesApi } from './disputesApi';

describe('disputesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens a dispute with partial quantity payload', async () => {
    post.mockResolvedValue({
      data: {
        _id: 'd1',
        disputeNumber: 'DSP-9',
        status: 'open',
        orderQuantity: 5,
        disputedQuantity: 2,
        disputedAmount: 20,
        isPartial: true,
        reason: 'Broken',
        description: 'Two accounts failed',
      },
      message: 'Dispute opened',
    });

    const result = await disputesApi.open({
      orderId: 'o1',
      reason: 'Broken',
      description: 'Two accounts failed',
      disputedQuantity: 2,
      evidence: ['https://example.com/e.png'],
    });

    expect(post).toHaveBeenCalledWith('/disputes', expect.objectContaining({
      orderId: 'o1',
      disputedQuantity: 2,
      evidence: ['https://example.com/e.png'],
    }));
    expect(result.dispute.disputeNumber).toBe('DSP-9');
    expect(result.dispute.isPartial).toBe(true);
  });

  it('lists seller disputes and sends chat messages', async () => {
    get.mockResolvedValueOnce({
      data: [{ _id: 'd1', disputeNumber: 'DSP-1', status: 'open', reason: 'x', description: 'long enough' }],
      meta: { page: 1 },
    });
    const listed = await disputesApi.list({ scope: 'seller' });
    expect(get).toHaveBeenCalledWith('/disputes', { params: { page: 1, limit: 20, scope: 'seller' } });
    expect(listed.items).toHaveLength(1);

    post.mockResolvedValueOnce({
      data: { _id: 'm1', body: 'hello', senderRole: 'seller', createdAt: '2026-01-01' },
      message: 'ok',
    });
    const sent = await disputesApi.sendMessage('d1', { body: 'hello', attachments: ['https://example.com/a.png'] });
    expect(post).toHaveBeenCalledWith('/disputes/d1/chat/messages', {
      body: 'hello',
      attachments: ['https://example.com/a.png'],
    });
    expect(sent.message.body).toBe('hello');
  });

  it('supports replacement submit and buyer respond', async () => {
    post.mockResolvedValueOnce({
      data: { _id: 'r1', version: 1, status: 'pending', accounts: [{ accountIdentifier: 'a1' }] },
      message: 'sent',
    });
    const created = await disputesApi.sendReplacement('d1', {
      notes: 'here',
      accounts: [{ accountIdentifier: 'a1', password: 'secret' }],
    });
    expect(created.replacement.versionLabel).toBe('v1');

    post.mockResolvedValueOnce({
      data: { _id: 'r1', version: 1, status: 'accepted', accounts: [] },
      message: 'accepted',
    });
    const responded = await disputesApi.respondReplacement('d1', 'r1', { decision: 'accepted' });
    expect(responded.replacement.status).toBe('accepted');
  });
});
