import { describe, expect, it } from 'vitest';
import { mapAdminProduct } from './adminMappers';

describe('mapAdminProduct publish visibility', () => {
  it('maps live+approved as Published (active)', () => {
    const mapped = mapAdminProduct({
      _id: 'p1',
      title: 'Live Product',
      status: 'live',
      approvalStatus: 'approved',
      visibility: 'public',
      price: 10,
    });
    expect(mapped.status).toBe('active');
    expect(mapped.approvalStatus).toBe('approved');
  });

  it('maps live+pending as Pending review (not Published)', () => {
    const mapped = mapAdminProduct({
      _id: 'p2',
      title: 'Awaiting Review',
      status: 'live',
      approvalStatus: 'pending',
      visibility: 'public',
      price: 10,
    });
    expect(mapped.status).toBe('pending');
    expect(mapped.approvalStatus).toBe('pending');
  });
});
