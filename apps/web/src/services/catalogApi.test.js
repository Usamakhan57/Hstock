import { describe, expect, it } from 'vitest';
import { applyClientFilters, applySort, normalizeSort, buildProductQuery } from './catalogApi';
import { DEFAULT_FILTERS } from '../constants';

describe('catalogApi helpers', () => {
  const products = [
    {
      id: '1',
      title: 'A',
      price: 10,
      rating: 4.9,
      reviewCount: 3,
      downloads: 5,
      cat: 'Domains',
      verifiedSeller: true,
      unlimitedStock: true,
      stock: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      fileTypes: ['Domain Transfer'],
      licenseIds: ['personal'],
    },
    {
      id: '2',
      title: 'B',
      price: 100,
      rating: 3.5,
      reviewCount: 1,
      downloads: 50,
      cat: 'SaaS',
      verifiedSeller: false,
      unlimitedStock: false,
      stock: 0,
      createdAt: '2026-06-01T00:00:00.000Z',
      fileTypes: ['License Key'],
      licenseIds: ['commercial'],
    },
  ];

  it('normalizes legacy sort labels', () => {
    expect(normalizeSort('Popular')).toBe('Most Popular');
    expect(normalizeSort('Top Rated')).toBe('Best Rated');
    expect(normalizeSort('Oldest')).toBe('Oldest');
  });

  it('sorts by newest, oldest, price, rating, and popularity', () => {
    expect(applySort(products, 'Newest').map((p) => p.id)).toEqual(['2', '1']);
    expect(applySort(products, 'Oldest').map((p) => p.id)).toEqual(['1', '2']);
    expect(applySort(products, 'Price: Low to High').map((p) => p.id)).toEqual(['1', '2']);
    expect(applySort(products, 'Best Rated').map((p) => p.id)).toEqual(['1', '2']);
    expect(applySort(products, 'Most Popular').map((p) => p.id)).toEqual(['2', '1']);
  });

  it('filters by rating, availability, and verified seller', () => {
    const filtered = applyClientFilters(products, {
      ...DEFAULT_FILTERS,
      rating: 4.5,
      availability: 'in_stock',
      verifiedOnly: true,
    });
    expect(filtered.map((p) => p.id)).toEqual(['1']);
  });

  it('builds backend product query params', () => {
    expect(buildProductQuery({
      page: 2,
      limit: 8,
      search: 'instagram',
      category: 'c1',
      collection: 'col1',
      seller: 's1',
      featured: true,
    })).toEqual({
      page: 2,
      limit: 8,
      search: 'instagram',
      category: 'c1',
      collection: 'col1',
      seller: 's1',
      featured: 'true',
    });
  });
});
