import { describe, expect, it } from 'vitest';
import { formatSoldCount } from './formatSoldCount';

describe('formatSoldCount', () => {
  it('returns New when unavailable', () => {
    expect(formatSoldCount(null)).toBe('New');
    expect(formatSoldCount(undefined)).toBe('New');
    expect(formatSoldCount(0)).toBe('New');
    expect(formatSoldCount('')).toBe('New');
  });

  it('formats whole counts under 1000', () => {
    expect(formatSoldCount(250)).toBe('250 Sold');
    expect(formatSoldCount(3)).toBe('3 Sold');
  });

  it('formats thousands with k suffix', () => {
    expect(formatSoldCount(1200)).toBe('1.2k Sold');
    expect(formatSoldCount(1000)).toBe('1k Sold');
    expect(formatSoldCount(10500)).toBe('10.5k Sold');
  });
});
