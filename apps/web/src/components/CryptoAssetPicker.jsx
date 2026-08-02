import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  filterWithdrawAssets,
  formatAssetNetworkLabel,
  getNetworksForCoin,
  getWithdrawAsset,
} from '../constants/cryptoAssets';

function AssetIcon({ asset, size = 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-black text-white shadow-sm ${dim}`}
      style={{ backgroundColor: asset?.color || '#64748b' }}
      aria-hidden="true"
    >
      {String(asset?.symbol || '?').slice(0, 4)}
    </span>
  );
}

/**
 * Cryptomus-style currency / network picker with search, icons, and checkmarks.
 */
const CryptoAssetPicker = ({
  coin,
  network,
  onCoinChange,
  onNetworkChange,
  disabled = false,
}) => {
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [query, setQuery] = useState('');

  const asset = useMemo(() => getWithdrawAsset(coin), [coin]);
  const networks = useMemo(() => getNetworksForCoin(coin), [coin]);
  const filteredAssets = useMemo(() => filterWithdrawAssets(query), [query]);
  const selectedNetwork = networks.find((item) => item.code === network) || networks[0];

  useEffect(() => {
    if (!currencyOpen && !networkOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setCurrencyOpen(false);
        setNetworkOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [currencyOpen, networkOpen]);

  useEffect(() => {
    if (!currencyOpen) setQuery('');
  }, [currencyOpen]);

  const selectCoin = (symbol) => {
    const nextNetworks = getNetworksForCoin(symbol);
    onCoinChange?.(symbol);
    onNetworkChange?.(nextNetworks[0]?.code || network);
    setCurrencyOpen(false);
  };

  const selectNetwork = (code) => {
    onNetworkChange?.(code);
    setNetworkOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Currency</label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setCurrencyOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/50 px-3 py-3 text-left transition hover:bg-secondary disabled:opacity-60"
          >
            <span className="flex min-w-0 items-center gap-3">
              <AssetIcon asset={asset} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-foreground">{asset.symbol}</span>
                <span className="block truncate text-xs text-muted-foreground">{asset.name}</span>
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Network</label>
          <button
            type="button"
            disabled={disabled || networks.length <= 1}
            onClick={() => networks.length > 1 && setNetworkOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/50 px-3 py-3 text-left transition hover:bg-secondary disabled:opacity-60"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">{selectedNetwork?.label || network}</span>
              <span className="block truncate text-xs text-muted-foreground">{selectedNetwork?.code || network}</span>
            </span>
            {networks.length > 1 ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Selected payout route: <span className="font-semibold text-foreground">{formatAssetNetworkLabel(coin, selectedNetwork?.code || network)}</span>
      </p>

      {currencyOpen && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label="Close currency picker" onClick={() => setCurrencyOpen(false)} />
          <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl sm:rounded-[1.5rem]">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Select currency</p>
                <h3 className="mt-1 text-lg font-black text-foreground">Withdraw asset</h3>
              </div>
              <button type="button" onClick={() => setCurrencyOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-border px-4 py-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search USDT, BTC, Solana…"
                  className="w-full rounded-2xl border border-border bg-secondary/40 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filteredAssets.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">No currencies match your search.</p>
              ) : (
                filteredAssets.map((item) => {
                  const selected = item.symbol === asset.symbol;
                  return (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => selectCoin(item.symbol)}
                      className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${selected ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                    >
                      <AssetIcon asset={item} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-black text-foreground">{item.symbol}</span>
                          <span className="truncate text-xs text-muted-foreground">{item.name}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {item.networks.map((n) => n.label).slice(0, 3).join(' · ')}
                          {item.networks.length > 3 ? ` +${item.networks.length - 3}` : ''}
                        </span>
                      </span>
                      {selected ? <Check className="h-5 w-5 shrink-0 text-primary" /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      {networkOpen && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label="Close network picker" onClick={() => setNetworkOpen(false)} />
          <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl sm:rounded-[1.5rem]">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{asset.symbol} networks</p>
                <h3 className="mt-1 text-lg font-black text-foreground">Select network</h3>
              </div>
              <button type="button" onClick={() => setNetworkOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              {networks.map((item) => {
                const selected = item.code === (selectedNetwork?.code || network);
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => selectNetwork(item.code)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${selected ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-black text-foreground">
                      {item.code.slice(0, 4)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-foreground">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.code}</span>
                    </span>
                    {selected ? <Check className="h-5 w-5 shrink-0 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
};

export default CryptoAssetPicker;
