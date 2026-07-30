/**
 * Supported withdrawal coins and Cryptomus-compatible networks.
 * Payment logic is NOT implemented here — schema preparation only.
 */

export const SUPPORTED_COINS = Object.freeze([
  'BTC',
  'ETH',
  'USDT',
  'TRX',
  'BNB',
  'DOGE',
  'SOL',
  'LTC',
  'TON',
  'XRP',
]);

/** Cryptomus-compatible network codes commonly used with the coins above */
export const CRYPTOMUS_NETWORKS = Object.freeze([
  'BTC',
  'ETH',
  'ERC20',
  'TRON',
  'TRC20',
  'BSC',
  'BEP20',
  'POLYGON',
  'ARBITRUM',
  'AVALANCHE',
  'SOL',
  'TON',
  'DOGE',
  'LTC',
  'XRP',
  'BNB',
]);

export const COIN_NETWORK_MAP = Object.freeze({
  BTC: ['BTC'],
  ETH: ['ETH', 'ERC20', 'ARBITRUM'],
  USDT: ['TRC20', 'ERC20', 'BEP20', 'BSC', 'POLYGON', 'TON', 'SOL', 'ARBITRUM', 'AVALANCHE'],
  TRX: ['TRON', 'TRC20'],
  BNB: ['BSC', 'BEP20'],
  DOGE: ['DOGE'],
  SOL: ['SOL'],
  LTC: ['LTC'],
  TON: ['TON'],
  XRP: ['XRP'],
});

export default {
  SUPPORTED_COINS,
  CRYPTOMUS_NETWORKS,
  COIN_NETWORK_MAP,
};
