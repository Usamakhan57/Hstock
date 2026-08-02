import { describe, expect, it } from 'vitest';
import {
  WITHDRAW_CRYPTO_ASSETS,
  filterWithdrawAssets,
  getDefaultNetworkForCoin,
  getNetworksForCoin,
  getWithdrawAsset,
  resolveNetworkForCoin,
} from './cryptoAssets';

describe('cryptoAssets', () => {
  it('includes the required withdraw currencies', () => {
    const symbols = WITHDRAW_CRYPTO_ASSETS.map((asset) => asset.symbol);
    expect(symbols).toEqual([
      'USDT', 'BTC', 'ETH', 'BNB', 'USDC', 'TRX', 'LTC', 'SOL', 'TON', 'POL', 'XMR', 'DOGE', 'XRP',
    ]);
  });

  it('returns USDT networks including TRC20, ERC20, BEP20, Polygon, and Solana', () => {
    const codes = getNetworksForCoin('USDT').map((network) => network.code);
    expect(codes).toEqual(expect.arrayContaining([
      'TRC20', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'AVALANCHE', 'OPTIMISM', 'BASE', 'SOL',
    ]));
  });

  it('scopes networks per coin', () => {
    expect(getNetworksForCoin('BTC').map((n) => n.code)).toEqual(['BTC']);
    expect(getNetworksForCoin('SOL').map((n) => n.code)).toEqual(['SOL']);
    expect(getDefaultNetworkForCoin('USDT')).toBe('TRC20');
  });

  it('filters assets by search query', () => {
    expect(filterWithdrawAssets('teth').map((a) => a.symbol)).toContain('USDT');
    expect(filterWithdrawAssets('sol').map((a) => a.symbol)).toEqual(expect.arrayContaining(['SOL', 'USDT', 'USDC']));
    expect(getWithdrawAsset('pol').symbol).toBe('POL');
  });

  it('resets incompatible networks when currency changes', () => {
    expect(resolveNetworkForCoin('USDT', 'TRC20')).toBe('TRC20');
    expect(resolveNetworkForCoin('USDT', 'ERC20')).toBe('ERC20');
    expect(resolveNetworkForCoin('BTC', 'TRC20')).toBe('BTC');
    expect(resolveNetworkForCoin('SOL', 'ERC20')).toBe('SOL');
    expect(resolveNetworkForCoin('POL', 'POLYGON')).toBe('POLYGON');
  });

  it('exposes every required withdraw currency', () => {
    const required = ['USDT', 'BTC', 'ETH', 'BNB', 'USDC', 'TRX', 'LTC', 'SOL', 'TON', 'POL', 'XMR', 'DOGE', 'XRP'];
    required.forEach((symbol) => {
      expect(getWithdrawAsset(symbol).symbol).toBe(symbol);
      expect(getNetworksForCoin(symbol).length).toBeGreaterThan(0);
    });
  });
});
