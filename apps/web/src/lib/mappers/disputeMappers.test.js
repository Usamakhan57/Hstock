import { describe, expect, it } from 'vitest';
import {
  mapBackendDispute,
  mapTimelineEvent,
  mapChatMessage,
  mapReplacement,
  mapDisputeDashboard,
} from './disputeMappers';

describe('disputeMappers', () => {
  it('maps partial dispute quantities and escrow fields', () => {
    const dispute = mapBackendDispute({
      _id: 'd1',
      disputeNumber: 'DSP-1',
      status: 'open',
      isPartial: true,
      orderQuantity: 10,
      disputedQuantity: 3,
      disputedAmount: 30,
      reason: 'Bad account',
      description: 'Three accounts failed login',
      order: { orderNumber: 'ORD-1', productSnapshot: { title: 'IG Pack' } },
      evidence: ['https://example.com/e1.png'],
    });

    expect(dispute.id).toBe('d1');
    expect(dispute.isPartial).toBe(true);
    expect(dispute.disputedQuantity).toBe(3);
    expect(dispute.remainingQuantity).toBe(7);
    expect(dispute.productTitle).toBe('IG Pack');
    expect(dispute.evidenceUrls).toHaveLength(1);
  });

  it('maps timeline, chat, replacement, and dashboard shapes', () => {
    expect(mapTimelineEvent({ type: 'dispute_created', createdAt: '2026-01-01' }).label).toBe('Dispute Opened');
    expect(mapTimelineEvent({ type: 'replacement_sent' }).label).toBe('Replacement Submitted');

    const msg = mapChatMessage({
      _id: 'm1',
      body: 'Hello',
      senderRole: 'buyer',
      attachments: [{ url: 'https://example.com/a.png', ocrFlagged: true }],
      createdAt: '2026-01-02',
    });
    expect(msg.attachments[0].ocrFlagged).toBe(true);

    const rep = mapReplacement({ _id: 'r1', version: 2, status: 'pending', accounts: [{ accountIdentifier: 'acc-1' }] });
    expect(rep.versionLabel).toBe('v2');
    expect(rep.statusLabel).toBe('Pending');

    const dash = mapDisputeDashboard({
      quantities: { order: 5, disputed: 2, remaining: 3, held: 2 },
      amounts: { disputed: 20, held: 20, undisputed: 30 },
      ocrFlags: 1,
      timeline: [{ type: 'evidence_uploaded' }],
      replacementHistory: [{ version: 1, status: 'rejected', accounts: [] }],
    });
    expect(dash.amounts.disputed).toBe(20);
    expect(dash.ocrFlags).toBe(1);
    expect(dash.timeline[0].label).toBe('Evidence Uploaded');
  });
});
