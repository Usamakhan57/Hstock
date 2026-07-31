import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./catalogCache', () => {
  let products = [];
  return {
    getCachedProducts: () => products,
    hydrateCatalog: vi.fn(async () => {
      products = [
        { id: '1', categoryId: 'cat-a', slug: 'one' },
        { id: '2', categoryId: 'cat-a', slug: 'two' },
        { id: '3', categoryId: 'cat-b', slug: 'three' },
      ];
      return { products };
    }),
    __setProducts(next) {
      products = next;
    },
  };
});

import {
  findProductById,
  getProductCountByCategoryId,
  hydrateProducts,
  loadStorefrontProducts,
} from './productRepository';
import * as catalogCache from './catalogCache';

describe('productRepository', () => {
  beforeEach(async () => {
    await hydrateProducts({ force: true });
  });

  it('loads products from the catalog cache', () => {
    expect(loadStorefrontProducts()).toHaveLength(3);
    expect(findProductById('two')?.id).toBe('2');
  });

  it('returns a category count map when called without an id', () => {
    expect(getProductCountByCategoryId()).toEqual({
      'cat-a': 2,
      'cat-b': 1,
    });
  });

  it('returns a single category count when called with an id', () => {
    expect(getProductCountByCategoryId('cat-a')).toBe(2);
    expect(catalogCache.hydrateCatalog).toHaveBeenCalled();
  });
});
