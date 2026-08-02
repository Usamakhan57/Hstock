/**
 * Exchange-style crypto assets for seller withdrawals / payouts.
 * Network codes match backend COIN_NETWORK_MAP (Cryptomus-compatible).
 */

export const CRYPTO_NETWORKS = Object.freeze({
  TRC20: { code: 'TRC20', label: 'TRON (TRC20)', family: 'tron' },
  ERC20: { code: 'ERC20', label: 'Ethereum (ERC20)', family: 'evm' },
  BEP20: { code: 'BEP20', label: 'BSC (BEP20)', family: 'evm' },
  BSC: { code: 'BSC', label: 'BSC (BEP20)', family: 'evm' },
  POLYGON: { code: 'POLYGON', label: 'Polygon', family: 'evm' },
  ARBITRUM: { code: 'ARBITRUM', label: 'Arbitrum', family: 'evm' },
  AVALANCHE: { code: 'AVALANCHE', label: 'Avalanche', family: 'evm' },
  OPTIMISM: { code: 'OPTIMISM', label: 'Optimism', family: 'evm' },
  BASE: { code: 'BASE', label: 'Base', family: 'evm' },
  SOL: { code: 'SOL', label: 'Solana', family: 'sol' },
  BTC: { code: 'BTC', label: 'Bitcoin', family: 'btc' },
  ETH: { code: 'ETH', label: 'Ethereum', family: 'evm' },
  TRON: { code: 'TRON', label: 'TRON', family: 'tron' },
  DOGE: { code: 'DOGE', label: 'Dogecoin', family: 'doge' },
  LTC: { code: 'LTC', label: 'Litecoin', family: 'ltc' },
  TON: { code: 'TON', label: 'TON', family: 'ton' },
  XRP: { code: 'XRP', label: 'XRP Ledger', family: 'xrp' },
  XMR: { code: 'XMR', label: 'Monero', family: 'xmr' },
});

function nets(...codes) {
  return codes.map((code) => CRYPTO_NETWORKS[code]).filter(Boolean);
}

/** Currencies shown in the withdraw / wallet selector. */
export const WITHDRAW_CRYPTO_ASSETS = Object.freeze([
  {
    symbol: 'USDT',
    name: 'Tether',
    color: '#26A17B',
    networks: nets('TRC20', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'AVALANCHE', 'OPTIMISM', 'BASE', 'SOL'),
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    color: '#F7931A',
    networks: nets('BTC'),
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    networks: nets('ETH', 'ARBITRUM', 'OPTIMISM', 'BASE'),
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    color: '#F3BA2F',
    networks: nets('BEP20', 'BSC'),
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    color: '#2775CA',
    networks: nets('ERC20', 'BEP20', 'POLYGON', 'SOL', 'ARBITRUM', 'OPTIMISM', 'BASE', 'AVALANCHE'),
  },
  {
    symbol: 'TRX',
    name: 'TRON',
    color: '#FF0013',
    networks: nets('TRON', 'TRC20'),
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    color: '#345D9D',
    networks: nets('LTC'),
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    color: '#9945FF',
    networks: nets('SOL'),
  },
  {
    symbol: 'TON',
    name: 'Toncoin',
    color: '#0098EA',
    networks: nets('TON'),
  },
  {
    symbol: 'POL',
    name: 'Polygon',
    color: '#8247E5',
    networks: nets('POLYGON', 'ERC20'),
  },
  {
    symbol: 'XMR',
    name: 'Monero',
    color: '#FF6600',
    networks: nets('XMR'),
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    color: '#C2A633',
    networks: nets('DOGE'),
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    color: '#23292F',
    networks: nets('XRP'),
  },
]);

export function getWithdrawAsset(symbol) {
  const key = String(symbol || '').toUpperCase();
  return WITHDRAW_CRYPTO_ASSETS.find((asset) => asset.symbol === key) || WITHDRAW_CRYPTO_ASSETS[0];
}

export function getNetworksForCoin(symbol) {
  return getWithdrawAsset(symbol).networks || [];
}

export function getDefaultNetworkForCoin(symbol) {
  const networks = getNetworksForCoin(symbol);
  return networks[0]?.code || 'TRC20';
}

/** Keep current network when still valid; otherwise fall back to the coin default. */
export function resolveNetworkForCoin(symbol, currentNetwork) {
  const networks = getNetworksForCoin(symbol);
  const current = String(currentNetwork || '').toUpperCase();
  if (networks.some((network) => network.code === current)) {
    return current;
  }
  return networks[0]?.code || getDefaultNetworkForCoin(symbol);
}

export function filterWithdrawAssets(query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [...WITHDRAW_CRYPTO_ASSETS];
  return WITHDRAW_CRYPTO_ASSETS.filter((asset) => (
    asset.symbol.toLowerCase().includes(q)
    || asset.name.toLowerCase().includes(q)
    || asset.networks.some((network) => network.label.toLowerCase().includes(q) || network.code.toLowerCase().includes(q))
  ));
}

export function formatAssetNetworkLabel(coin, network) {
  const asset = getWithdrawAsset(coin);
  const net = (asset.networks || []).find((item) => item.code === network);
  if (!net) return `${coin} · ${network}`;
  return `${asset.symbol} · ${net.label}`;
}

export default {
  CRYPTO_NETWORKS,
  WITHDRAW_CRYPTO_ASSETS,
  getWithdrawAsset,
  getNetworksForCoin,
  getDefaultNetworkForCoin,
  resolveNetworkForCoin,
  filterWithdrawAssets,
  formatAssetNetworkLabel,
};
