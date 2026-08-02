/**
 * Exchange-style crypto assets for seller withdrawals / payouts.
 * Network codes match backend COIN_NETWORK_MAP (Cryptomus-compatible).
 *
 * Checkout also consumes Cryptomus-native network codes (tron, eth, bsc, …)
 * via dynamic catalogs from GET /payments/cryptomus/checkout-assets.
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
  // Cryptomus-native codes (checkout)
  tron: { code: 'tron', label: 'TRON (TRC20)', family: 'tron' },
  eth: { code: 'eth', label: 'Ethereum (ERC20)', family: 'evm' },
  bsc: { code: 'bsc', label: 'BSC (BEP20)', family: 'evm' },
  polygon: { code: 'polygon', label: 'Polygon', family: 'evm' },
  arbitrum: { code: 'arbitrum', label: 'Arbitrum', family: 'evm' },
  avalanche: { code: 'avalanche', label: 'Avalanche', family: 'evm' },
  optimism: { code: 'optimism', label: 'Optimism', family: 'evm' },
  base: { code: 'base', label: 'Base', family: 'evm' },
  sol: { code: 'sol', label: 'Solana', family: 'sol' },
  btc: { code: 'btc', label: 'Bitcoin', family: 'btc' },
  ton: { code: 'ton', label: 'TON', family: 'ton' },
  doge: { code: 'doge', label: 'Dogecoin', family: 'doge' },
  ltc: { code: 'ltc', label: 'Litecoin', family: 'ltc' },
  xrp: { code: 'xrp', label: 'XRP Ledger', family: 'xrp' },
  monero: { code: 'monero', label: 'Monero', family: 'xmr' },
  etc: { code: 'etc', label: 'Ethereum Classic', family: 'evm' },
  bch: { code: 'bch', label: 'Bitcoin Cash', family: 'btc' },
});

function nets(...codes) {
  return codes.map((code) => CRYPTO_NETWORKS[code]).filter(Boolean);
}

function cryptomusNets(...codes) {
  return codes.map((code) => {
    const known = CRYPTO_NETWORKS[code];
    if (known) return known;
    const label = String(code).replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { code, label, family: 'other' };
  });
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

/** Offline checkout catalog (Cryptomus-native network codes). */
export const CHECKOUT_CRYPTO_ASSETS = Object.freeze([
  {
    symbol: 'USDT',
    name: 'Tether',
    color: '#26A17B',
    networks: cryptomusNets('tron', 'eth', 'bsc', 'polygon', 'arbitrum', 'avalanche', 'optimism', 'base', 'sol'),
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    color: '#2775CA',
    networks: cryptomusNets('eth', 'bsc', 'polygon', 'sol', 'arbitrum', 'optimism', 'base', 'avalanche'),
  },
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', networks: cryptomusNets('btc') },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    networks: cryptomusNets('eth', 'arbitrum', 'optimism', 'base'),
  },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F', networks: cryptomusNets('bsc') },
  { symbol: 'TRX', name: 'TRON', color: '#FF0013', networks: cryptomusNets('tron') },
  { symbol: 'TON', name: 'Toncoin', color: '#0098EA', networks: cryptomusNets('ton') },
  { symbol: 'SOL', name: 'Solana', color: '#9945FF', networks: cryptomusNets('sol') },
  { symbol: 'XRP', name: 'XRP', color: '#23292F', networks: cryptomusNets('xrp') },
  { symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633', networks: cryptomusNets('doge') },
  { symbol: 'LTC', name: 'Litecoin', color: '#345D9D', networks: cryptomusNets('ltc') },
  { symbol: 'XMR', name: 'Monero', color: '#FF6600', networks: cryptomusNets('monero') },
  { symbol: 'POL', name: 'Polygon', color: '#8247E5', networks: cryptomusNets('polygon') },
  { symbol: 'AVAX', name: 'Avalanche', color: '#E84142', networks: cryptomusNets('avalanche') },
  { symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0', networks: cryptomusNets('arbitrum') },
  { symbol: 'OP', name: 'Optimism', color: '#FF0420', networks: cryptomusNets('optimism') },
  { symbol: 'ETC', name: 'Ethereum Classic', color: '#328332', networks: cryptomusNets('etc') },
  { symbol: 'BCH', name: 'Bitcoin Cash', color: '#8DC351', networks: cryptomusNets('bch') },
]);

function normalizeCatalog(assets) {
  if (!Array.isArray(assets) || assets.length === 0) return null;
  return assets
    .map((asset) => {
      const symbol = String(asset?.symbol || '').toUpperCase();
      if (!symbol) return null;
      const networks = (Array.isArray(asset.networks) ? asset.networks : [])
        .map((network) => {
          if (typeof network === 'string') {
            return cryptomusNets(network)[0];
          }
          const code = String(network?.code || '').trim();
          if (!code) return null;
          return {
            code,
            label: network.label || cryptomusNets(code)[0]?.label || code,
            family: network.family || 'other',
          };
        })
        .filter(Boolean);
      if (!networks.length) return null;
      return {
        symbol,
        name: asset.name || symbol,
        color: asset.color || '#64748b',
        networks,
      };
    })
    .filter(Boolean);
}

export function getAssetFromCatalog(assets, symbol) {
  const catalog = normalizeCatalog(assets) || WITHDRAW_CRYPTO_ASSETS;
  const key = String(symbol || '').toUpperCase();
  return catalog.find((asset) => asset.symbol === key) || catalog[0];
}

export function getNetworksFromCatalog(assets, symbol) {
  return getAssetFromCatalog(assets, symbol)?.networks || [];
}

export function resolveNetworkFromCatalog(assets, symbol, currentNetwork) {
  const networks = getNetworksFromCatalog(assets, symbol);
  const current = String(currentNetwork || '').toLowerCase();
  const match = networks.find((network) => String(network.code).toLowerCase() === current);
  if (match) return match.code;
  return networks[0]?.code || null;
}

export function filterAssetCatalog(assets, query = '') {
  const catalog = normalizeCatalog(assets) || WITHDRAW_CRYPTO_ASSETS;
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [...catalog];
  return catalog.filter((asset) => (
    asset.symbol.toLowerCase().includes(q)
    || asset.name.toLowerCase().includes(q)
    || asset.networks.some((network) => (
      network.label.toLowerCase().includes(q) || String(network.code).toLowerCase().includes(q)
    ))
  ));
}

export function formatCatalogRoute(assets, coin, network) {
  const asset = getAssetFromCatalog(assets, coin);
  const net = (asset.networks || []).find(
    (item) => String(item.code).toLowerCase() === String(network || '').toLowerCase(),
  );
  if (!net) return `${coin} · ${network}`;
  return `${asset.symbol} · ${net.label}`;
}

export function getWithdrawAsset(symbol) {
  return getAssetFromCatalog(WITHDRAW_CRYPTO_ASSETS, symbol);
}

export function getNetworksForCoin(symbol) {
  return getNetworksFromCatalog(WITHDRAW_CRYPTO_ASSETS, symbol);
}

export function getDefaultNetworkForCoin(symbol) {
  const networks = getNetworksForCoin(symbol);
  return networks[0]?.code || 'TRC20';
}

/** Keep current network when still valid; otherwise fall back to the coin default. */
export function resolveNetworkForCoin(symbol, currentNetwork) {
  return resolveNetworkFromCatalog(WITHDRAW_CRYPTO_ASSETS, symbol, currentNetwork)
    || getDefaultNetworkForCoin(symbol);
}

export function filterWithdrawAssets(query = '') {
  return filterAssetCatalog(WITHDRAW_CRYPTO_ASSETS, query);
}

export function formatAssetNetworkLabel(coin, network) {
  return formatCatalogRoute(WITHDRAW_CRYPTO_ASSETS, coin, network);
}

export default {
  CRYPTO_NETWORKS,
  WITHDRAW_CRYPTO_ASSETS,
  CHECKOUT_CRYPTO_ASSETS,
  getWithdrawAsset,
  getNetworksForCoin,
  getDefaultNetworkForCoin,
  resolveNetworkForCoin,
  filterWithdrawAssets,
  formatAssetNetworkLabel,
  getAssetFromCatalog,
  getNetworksFromCatalog,
  resolveNetworkFromCatalog,
  filterAssetCatalog,
  formatCatalogRoute,
};
