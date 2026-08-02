import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FALLBACK_CHECKOUT_ASSETS,
  mapPaymentServicesToAssets,
  networkLabel,
  networksEqual,
  normalizeCryptomusNetwork,
} from '../../src/helpers/cryptomusAssets.helper.js';

describe('cryptomusAssets.helper', () => {
  it('normalizes UI aliases to Cryptomus network codes', () => {
    assert.equal(normalizeCryptomusNetwork('TRC20'), 'tron');
    assert.equal(normalizeCryptomusNetwork('ERC20'), 'eth');
    assert.equal(normalizeCryptomusNetwork('BEP20'), 'bsc');
    assert.equal(normalizeCryptomusNetwork('POLYGON'), 'polygon');
    assert.equal(normalizeCryptomusNetwork('tron'), 'tron');
    assert.equal(normalizeCryptomusNetwork('Bitcoin'), 'btc');
    assert.equal(normalizeCryptomusNetwork('XMR'), 'monero');
  });

  it('compares networks case-insensitively after normalization', () => {
    assert.equal(networksEqual('TRC20', 'tron'), true);
    assert.equal(networksEqual('ERC20', 'eth'), true);
    assert.equal(networksEqual('TRC20', 'eth'), false);
  });

  it('maps Cryptomus payment services into currency/network catalog', () => {
    const assets = mapPaymentServicesToAssets([
      { currency: 'USDT', network: 'tron', is_available: true },
      { currency: 'USDT', network: 'eth', is_available: true },
      { currency: 'USDT', network: 'bsc', is_available: true },
      { currency: 'BTC', network: 'btc', is_available: true },
      { currency: 'ETH', network: 'eth', is_available: false },
      { currency: 'SOL', network: 'sol', is_available: true },
      { currency: 'FAKE', network: '', is_available: true },
    ]);

    const usdt = assets.find((asset) => asset.symbol === 'USDT');
    assert.ok(usdt);
    assert.deepEqual(
      usdt.networks.map((n) => n.code).sort(),
      ['bsc', 'eth', 'tron'],
    );
    assert.ok(usdt.networks.every((n) => n.label));
    assert.ok(assets.find((asset) => asset.symbol === 'BTC'));
    assert.ok(assets.find((asset) => asset.symbol === 'SOL'));
    assert.equal(assets.some((asset) => asset.symbol === 'ETH'), false);
  });

  it('exposes a broad offline fallback catalog', () => {
    const symbols = FALLBACK_CHECKOUT_ASSETS.map((asset) => asset.symbol);
    for (const required of ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'TRX', 'TON', 'SOL', 'XRP', 'DOGE', 'LTC', 'XMR']) {
      assert.ok(symbols.includes(required), `missing ${required}`);
    }
    const usdt = FALLBACK_CHECKOUT_ASSETS.find((asset) => asset.symbol === 'USDT');
    assert.ok(usdt.networks.some((n) => n.code === 'tron'));
    assert.equal(networkLabel('tron'), 'TRON (TRC20)');
  });
});
