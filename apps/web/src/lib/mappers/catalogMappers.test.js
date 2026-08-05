import { describe, expect, it } from 'vitest';
import {
  mapBackendCategory,
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
      seller: { _id: 's1', storeName: 'Digital Pro', storeSlug: 'digital-pro', status: 'approved', verified: true },
      featured: true,
      salesCount: 42,
      deliveryType: 'instant',
    });

    expect(product.id).toBe('p1');
    expect(product.cat).toBe('Instagram Accounts');
    expect(product.categoryId).toBe('c1');
    expect(product.artist).toBe('Digital Pro');
    expect(product.sellerSlug).toBe('digital-pro');
    expect(product.price).toBe(99);
    expect(product.old).toBe(120);
    expect(product.downloads).toBe(42);
    expect(product.soldCount).toBe(42);
    expect(product.seller.name).toBe('Digital Pro');
    expect(product.sellerName).toBe('Digital Pro');
    expect(product.badge).toBe('Featured');
    expect(product.featured).toBe(true);
    expect(product.verifiedSeller).toBe(true);
    expect(product.deliveryType).toBe('instant');
    expect(product.rating).toBeNull();
  });

  it('maps categories and sellers', () => {
    expect(mapBackendCategory({ _id: 'c1', name: 'Domains', slug: 'domains' }).slug).toBe('domains');
    expect(mapBackendSeller({ _id: 's1', storeName: 'Acme', storeSlug: 'acme', status: 'approved' }).verified).toBe(false);
    expect(mapBackendSeller({
      _id: 's2',
      storeName: 'Verified Co',
      storeSlug: 'verified-co',
      status: 'approved',
      verified: true,
      logo: 'https://cdn.example/logo.png',
      banner: 'https://cdn.example/banner.png',
      bio: 'Trusted digital assets',
    })).toMatchObject({
      verified: true,
      sellerVerified: true,
      logo: 'https://cdn.example/logo.png',
      banner: 'https://cdn.example/banner.png',
      bio: 'Trusted digital assets',
    });
  });

  it('does not treat Lucide icon names as category image URLs', () => {
    const mapped = mapBackendCategory({
      _id: 'c2',
      name: 'Instagram Accounts',
      slug: 'instagram-accounts',
      icon: 'Instagram',
    });
    expect(mapped.image).toBeNull();
    expect(mapped.icon).toBe('Instagram');

    const withImage = mapBackendCategory({
      _id: 'c3',
      name: 'Netflix',
      slug: 'netflix',
      icon: 'Youtube',
      image: 'https://cdn.example/netflix.png',
    });
    expect(withImage.image).toBe('https://cdn.example/netflix.png');
    expect(withImage.icon).toBe('Youtube');
  });
});
