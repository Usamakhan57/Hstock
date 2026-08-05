import { describe, expect, it } from 'vitest';
import { STOREFRONT_SEARCH_PLACEHOLDER } from './searchPlaceholder';

describe('storefront search placeholder', () => {
  it('is exactly Search any product...', () => {
    expect(STOREFRONT_SEARCH_PLACEHOLDER).toBe('Search any product...');
  });
});
