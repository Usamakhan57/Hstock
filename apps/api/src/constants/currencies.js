/**
 * Listing / ledger currency is USD.
 * Cryptomus payment currencies are provider-defined and resolved at payment time (Phase 2+).
 */
export const LEDGER_CURRENCY = 'USD';

export const SUPPORTED_LISTING_CURRENCIES = Object.freeze(['USD']);

export const CRYPTOMUS_COMMON_ASSETS = Object.freeze([
  'BTC',
  'ETH',
  'USDT',
  'TRX',
  'BNB',
  'LTC',
  'TON',
]);

export default {
  LEDGER_CURRENCY,
  SUPPORTED_LISTING_CURRENCIES,
  CRYPTOMUS_COMMON_ASSETS,
};
