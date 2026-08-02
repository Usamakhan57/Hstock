import { describe, expect, it } from 'vitest';
import {
  filterCategoriesBySearch,
  filterProductsBySearchRelevance,
  tokenizeSearchQuery,
} from './productSearch';

describe('productSearch', () => {
  const catalog = [
    {
      id: '1',
      title: 'Old Gmail 2021-2024',
      shortDescription: 'Aged Gmail accounts',
      cat: 'Digital Assets',
      artist: 'PVAHub',
      assetPlatform: 'gmail',
    },
    {
      id: '2',
      title: 'Instagram Business',
      shortDescription: 'Verified Instagram profiles',
      cat: 'Social Media Accounts',
      artist: 'Jazzy',
      assetPlatform: 'instagram',
    },
    {
      id: '3',
      title: 'Facebook Page Pack',
      shortDescription: 'Aged Facebook pages',
      cat: 'Social Media Accounts',
      artist: 'PVAHub',
      assetPlatform: 'facebook',
    },
  ];

  it('tokenizes Instagram account without the generic account word', () => {
    expect(tokenizeSearchQuery('Instagram account')).toEqual(['instagram']);
  });

  it('does not return Gmail for Instagram queries', () => {
    const results = filterProductsBySearchRelevance(catalog, 'Instagram account');
    expect(results.map((p) => p.id)).toEqual(['2']);
  });

  it('returns Gmail for Gmail queries', () => {
    const results = filterProductsBySearchRelevance(catalog, 'Gmail');
    expect(results.map((p) => p.id)).toEqual(['1']);
  });

  it('returns only Facebook for Facebook queries', () => {
    const results = filterProductsBySearchRelevance(catalog, 'Facebook');
    expect(results.map((p) => p.id)).toEqual(['3']);
  });

  it('returns empty list when nothing matches', () => {
    expect(filterProductsBySearchRelevance(catalog, 'TikTok')).toEqual([]);
  });

  it('filters service/category chips by query', () => {
    const cats = [
      { id: 'a', name: 'Digital Assets', slug: 'digital-assets' },
      { id: 'b', name: 'Domains', slug: 'domains' },
    ];
    expect(filterCategoriesBySearch(cats, 'Digital').map((c) => c.name)).toEqual(['Digital Assets']);
    expect(filterCategoriesBySearch(cats, 'Instagram')).toEqual([]);
  });
});
