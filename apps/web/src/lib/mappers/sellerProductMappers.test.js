import { describe, expect, it } from 'vitest';
import { mapSellerProduct, toBackendProductPayload } from './sellerProductMappers';

describe('sellerProductMappers', () => {
  it('maps backend product into seller UI shape', () => {
    const mapped = mapSellerProduct({
      _id: 'p1',
      title: 'IG Growth',
      price: 49,
      status: 'live',
      productType: 'social_accounts',
      deliveryType: 'automatic',
      stock: 12,
      category: { _id: 'c1', name: 'Instagram' },
      thumbnail: 'https://cdn.example.com/t.png',
    });
    expect(mapped.id).toBe('p1');
    expect(mapped.category).toBe('Instagram');
    expect(mapped.listingType).toBe('social-account');
    expect(mapped.status).toBe('live');
  });

  it('builds backend create payload from seller form', () => {
    const payload = toBackendProductPayload({
      title: 'My Pack',
      shortDescription: 'Great pack',
      description: 'Longer description',
      price: 25,
      stock: 8,
      listingType: 'social-account',
      deliveryType: 'automatic',
      status: 'draft',
      thumbnail: 'https://cdn.example.com/t.png',
      categoryId: '507f1f77bcf86cd799439011',
    }, { publish: false });

    expect(payload.productType).toBe('social_accounts');
    expect(payload.status).toBe('draft');
    expect(payload.category).toBe('507f1f77bcf86cd799439011');
    expect(payload.thumbnail).toBe('https://cdn.example.com/t.png');
  });
});
