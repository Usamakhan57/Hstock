/**
 * Map Cryptomus /payment/services payloads into checkout currency/network catalogs.
 * Network codes are Cryptomus-native (tron, eth, bsc, …) — never UI aliases alone.
 */

const ASSET_META = Object.freeze({
  USDT: { name: 'Tether', color: '#26A17B' },
  USDC: { name: 'USD Coin', color: '#2775CA' },
  BTC: { name: 'Bitcoin', color: '#F7931A' },
  ETH: { name: 'Ethereum', color: '#627EEA' },
  BNB: { name: 'BNB', color: '#F3BA2F' },
  TRX: { name: 'TRON', color: '#FF0013' },
  TON: { name: 'Toncoin', color: '#0098EA' },
  SOL: { name: 'Solana', color: '#9945FF' },
  XRP: { name: 'XRP', color: '#23292F' },
  DOGE: { name: 'Dogecoin', color: '#C2A633' },
  LTC: { name: 'Litecoin', color: '#345D9D' },
  XMR: { name: 'Monero', color: '#FF6600' },
  POL: { name: 'Polygon', color: '#8247E5' },
  MATIC: { name: 'Polygon', color: '#8247E5' },
  AVAX: { name: 'Avalanche', color: '#E84142' },
  ARB: { name: 'Arbitrum', color: '#28A0F0' },
  OP: { name: 'Optimism', color: '#FF0420' },
  ETC: { name: 'Ethereum Classic', color: '#328332' },
  BCH: { name: 'Bitcoin Cash', color: '#8DC351' },
  DAI: { name: 'Dai', color: '#F5AC37' },
  SHIB: { name: 'Shiba Inu', color: '#FFA409' },
  LINK: { name: 'Chainlink', color: '#2A5ADA' },
  UNI: { name: 'Uniswap', color: '#FF007A' },
  BASE: { name: 'Base', color: '#0052FF' },
});

/** Friendly labels for Cryptomus network codes + common UI aliases. */
const NETWORK_LABELS = Object.freeze({
  tron: 'TRON (TRC20)',
  trc20: 'TRON (TRC20)',
  eth: 'Ethereum (ERC20)',
  erc20: 'Ethereum (ERC20)',
  bsc: 'BSC (BEP20)',
  bep20: 'BSC (BEP20)',
  polygon: 'Polygon',
  matic: 'Polygon',
  arbitrum: 'Arbitrum',
  avalanche: 'Avalanche',
  avax: 'Avalanche',
  optimism: 'Optimism',
  base: 'Base',
  sol: 'Solana',
  solana: 'Solana',
  btc: 'Bitcoin',
  bitcoin: 'Bitcoin',
  ton: 'TON',
  doge: 'Dogecoin',
  ltc: 'Litecoin',
  xrp: 'XRP Ledger',
  monero: 'Monero',
  xmr: 'Monero',
  etc: 'Ethereum Classic',
  bch: 'Bitcoin Cash',
  ethereum: 'Ethereum (ERC20)',
});

/**
 * Normalize any UI / legacy / Cryptomus network string to Cryptomus API network code.
 */
export function normalizeCryptomusNetwork(network) {
  if (network == null || network === '') return null;
  const raw = String(network).trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const lower = raw.toLowerCase();

  const aliasMap = {
    TRC20: 'tron',
    TRON: 'tron',
    ERC20: 'eth',
    ETH: 'eth',
    ETHEREUM: 'eth',
    BEP20: 'bsc',
    BSC: 'bsc',
    BNB: 'bsc',
    POLYGON: 'polygon',
    MATIC: 'polygon',
    POL: 'polygon',
    ARBITRUM: 'arbitrum',
    ARB: 'arbitrum',
    AVALANCHE: 'avalanche',
    AVAX: 'avalanche',
    OPTIMISM: 'optimism',
    OP: 'optimism',
    BASE: 'base',
    SOL: 'sol',
    SOLANA: 'sol',
    BTC: 'btc',
    BITCOIN: 'btc',
    TON: 'ton',
    DOGE: 'doge',
    LTC: 'ltc',
    XRP: 'xrp',
    XMR: 'monero',
    MONERO: 'monero',
    ETC: 'etc',
    BCH: 'bch',
  };

  return aliasMap[upper] || lower;
}

export function networkLabel(network) {
  const code = normalizeCryptomusNetwork(network) || String(network || '').toLowerCase();
  if (!code) return '';
  if (NETWORK_LABELS[code]) return NETWORK_LABELS[code];
  return code.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function networksEqual(a, b) {
  const left = normalizeCryptomusNetwork(a);
  const right = normalizeCryptomusNetwork(b);
  if (!left || !right) return !left && !right;
  return left === right;
}

/** Offline fallback when Cryptomus /payment/services is unavailable. */
export const FALLBACK_CHECKOUT_ASSETS = Object.freeze([
  {
    symbol: 'USDT',
    name: 'Tether',
    color: '#26A17B',
    networks: ['tron', 'eth', 'bsc', 'polygon', 'arbitrum', 'avalanche', 'optimism', 'base', 'sol'].map((code) => ({
      code,
      label: networkLabel(code),
    })),
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    color: '#2775CA',
    networks: ['eth', 'bsc', 'polygon', 'sol', 'arbitrum', 'optimism', 'base', 'avalanche'].map((code) => ({
      code,
      label: networkLabel(code),
    })),
  },
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', networks: [{ code: 'btc', label: networkLabel('btc') }] },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    networks: ['eth', 'arbitrum', 'optimism', 'base'].map((code) => ({ code, label: networkLabel(code) })),
  },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F', networks: [{ code: 'bsc', label: networkLabel('bsc') }] },
  { symbol: 'TRX', name: 'TRON', color: '#FF0013', networks: [{ code: 'tron', label: networkLabel('tron') }] },
  { symbol: 'TON', name: 'Toncoin', color: '#0098EA', networks: [{ code: 'ton', label: networkLabel('ton') }] },
  { symbol: 'SOL', name: 'Solana', color: '#9945FF', networks: [{ code: 'sol', label: networkLabel('sol') }] },
  { symbol: 'XRP', name: 'XRP', color: '#23292F', networks: [{ code: 'xrp', label: networkLabel('xrp') }] },
  { symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633', networks: [{ code: 'doge', label: networkLabel('doge') }] },
  { symbol: 'LTC', name: 'Litecoin', color: '#345D9D', networks: [{ code: 'ltc', label: networkLabel('ltc') }] },
  { symbol: 'XMR', name: 'Monero', color: '#FF6600', networks: [{ code: 'monero', label: networkLabel('monero') }] },
  { symbol: 'POL', name: 'Polygon', color: '#8247E5', networks: [{ code: 'polygon', label: networkLabel('polygon') }] },
  { symbol: 'AVAX', name: 'Avalanche', color: '#E84142', networks: [{ code: 'avalanche', label: networkLabel('avalanche') }] },
  { symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0', networks: [{ code: 'arbitrum', label: networkLabel('arbitrum') }] },
  { symbol: 'OP', name: 'Optimism', color: '#FF0420', networks: [{ code: 'optimism', label: networkLabel('optimism') }] },
  { symbol: 'ETC', name: 'Ethereum Classic', color: '#328332', networks: [{ code: 'etc', label: networkLabel('etc') }] },
  { symbol: 'BCH', name: 'Bitcoin Cash', color: '#8DC351', networks: [{ code: 'bch', label: networkLabel('bch') }] },
]);

function assetMeta(symbol) {
  return ASSET_META[symbol] || { name: symbol, color: '#64748b' };
}

/**
 * Convert Cryptomus services list → [{ symbol, name, color, networks: [{code,label}] }].
 */
export function mapPaymentServicesToAssets(services) {
  const rows = Array.isArray(services)
    ? services
    : (Array.isArray(services?.items) ? services.items : []);

  const bySymbol = new Map();

  for (const svc of rows) {
    if (!svc || svc.is_available === false) continue;
    const symbol = String(svc.currency || svc.currency_code || svc.to_currency || '')
      .trim()
      .toUpperCase();
    const network = normalizeCryptomusNetwork(svc.network || svc.network_code);
    if (!symbol || !network) continue;

    if (!bySymbol.has(symbol)) {
      const meta = assetMeta(symbol);
      bySymbol.set(symbol, {
        symbol,
        name: meta.name,
        color: meta.color,
        networks: [],
      });
    }

    const asset = bySymbol.get(symbol);
    if (!asset.networks.some((n) => n.code === network)) {
      asset.networks.push({ code: network, label: networkLabel(network) });
    }
  }

  const preferred = [
    'USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'TRX', 'TON', 'SOL', 'XRP',
    'DOGE', 'LTC', 'XMR', 'POL', 'MATIC', 'AVAX', 'ARB', 'OP', 'ETC', 'BCH',
  ];
  const rank = new Map(preferred.map((s, i) => [s, i]));

  return Array.from(bySymbol.values())
    .map((asset) => ({
      ...asset,
      networks: asset.networks.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => {
      const ra = rank.has(a.symbol) ? rank.get(a.symbol) : 1000;
      const rb = rank.has(b.symbol) ? rank.get(b.symbol) : 1000;
      if (ra !== rb) return ra - rb;
      return a.symbol.localeCompare(b.symbol);
    });
}

export default {
  normalizeCryptomusNetwork,
  networkLabel,
  networksEqual,
  mapPaymentServicesToAssets,
  FALLBACK_CHECKOUT_ASSETS,
};
