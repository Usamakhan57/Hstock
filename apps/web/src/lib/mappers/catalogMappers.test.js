import { describe, expect, it } from 'vitest';
import {
  mapBackendCategory,
  mapBackendCollection,
  mapBackendProduct,
  mapBackendSeller,
} from './catalogMappers';

describe('catalogMappers', () => {
  it('maps backend products to storefront shape', () => {
    const product = mapBackendProduct({
      _id: 'p1',
      title: 'Instagram Account',
      slug: 'instagram-account',
      price: 99,
      compareAtPrice: 120,
      thumbnail: 'https://cdn.example/img.jpg',
      category: { _id: 'c1', name: 'Instagram Accounts', slug: 'instagram' },
      seller: { _id: 's1', storeName: 'Digital Pro', storeSlug: 'digital-pro', status: 'approved' },
      featured: true,
      salesCount: 42,
    });

    expect(product.id).toBe('p1');
    expect(product.cat).toBe('Instagram Accounts');
    expect(product.categoryId).toBe('c1');
    expect(product.artist).toBe('Digital Pro');
    expect(product.sellerSlug).toBe('digital-pro');
    expect(product.price).toBe(99);
    expect(product.old).toBe(120);
    expect(product.downloads).toBe(42);
    expect(product.badge).toBe('Featured');
  });

  it('maps categories, collections, and sellers', () => {
    expect(mapBackendCategory({ _id: 'c1', name: 'Domains', slug: 'domains' }).slug).toBe('domains');
    expect(mapBackendCollection({ _id: 'col1', name: 'Starter Pack', slug: 'starter' }).name).toBe('Starter Pack');
    expect(mapBackendSeller({ _id: 's1', storeName: 'Acme', storeSlug: 'acme', status: 'approved' }).verified).toBe(true);
  });
});
