import { describe, expect, it } from 'vitest';
import { getStockStatus, getDeliveryTime, isManualHandover } from './productMeta';

describe('productMeta stock badges', () => {
  it('formats remaining stock as N Left', () => {
    expect(getStockStatus({ stock: 3 })).toEqual({ label: '3 Left', tone: 'positive' });
    expect(getStockStatus({ stock: 20 })).toEqual({ label: '20 Left', tone: 'positive' });
    expect(getStockStatus({ stock: 180 })).toEqual({ label: '180 Left', tone: 'positive' });
  });

  it('shows Out of Stock when stock is zero', () => {
    expect(getStockStatus({ stock: 0 })).toEqual({ label: 'Out of Stock', tone: 'destructive' });
  });

  it('hides badge for unlimited inventory', () => {
    expect(getStockStatus({ stock: 5, unlimitedStock: true })).toBeNull();
  });
});

describe('productMeta instant access', () => {
  it('detects instant delivery for automatic products', () => {
    expect(isManualHandover({ deliveryType: 'automatic' })).toBe(false);
    expect(getDeliveryTime({ deliveryType: 'automatic' })).toMatch(/instant/i);
  });
});
