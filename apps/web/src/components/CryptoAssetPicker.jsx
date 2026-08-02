import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  filterWithdrawAssets,
  formatAssetNetworkLabel,
  getNetworksForCoin,
  getWithdrawAsset,
  resolveNetworkForCoin,
  WITHDRAW_CRYPTO_ASSETS,
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
 * Cryptomus-style currency / network picker.
 * Uses nested Dialogs so selection works inside the withdraw modal
 * (portals to body were blocked by Radix pointer-events).
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
    if (!currencyOpen) setQuery('');
  }, [currencyOpen]);

  // Keep network valid whenever coin/network props drift.
  useEffect(() => {
    const resolved = resolveNetworkForCoin(coin, network);
    if (resolved && resolved !== network) {
      onNetworkChange?.(resolved);
    }
  }, [coin, network, onNetworkChange]);

  const selectCoin = (symbol, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const nextSymbol = String(symbol || '').toUpperCase();
    const nextNetwork = resolveNetworkForCoin(nextSymbol, network);
    onCoinChange?.(nextSymbol);
    onNetworkChange?.(nextNetwork);
    setCurrencyOpen(false);
  };

  const selectNetwork = (code, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onNetworkChange?.(String(code || '').toUpperCase());
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
            data-testid="crypto-currency-trigger"
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
            onClick={() => {
              if (networks.length > 1) setNetworkOpen(true);
            }}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/50 px-3 py-3 text-left transition hover:bg-secondary disabled:opacity-60"
            data-testid="crypto-network-trigger"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">{selectedNetwork?.label || network}</span>
              <span className="block truncate text-xs text-muted-foreground">{selectedNetwork?.code || network}</span>
            </span>
            {networks.length > 1 ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" data-testid="crypto-selected-route">
        Selected payout route:{' '}
        <span className="font-semibold text-foreground">
          {formatAssetNetworkLabel(coin, selectedNetwork?.code || network)}
        </span>
      </p>

      <Dialog open={currencyOpen} onOpenChange={setCurrencyOpen}>
        <DialogContent
          className="z-[80] max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-md"
          onOpenAutoFocus={(event) => {
            // Focus search input instead of close button.
            event.preventDefault();
            const root = event.currentTarget;
            root?.querySelector?.('input[data-crypto-search]')?.focus?.();
          }}
        >
          <DialogHeader className="border-b border-border px-4 py-4 text-left">
            <DialogTitle>Withdraw asset</DialogTitle>
            <DialogDescription>Select a currency for this withdrawal.</DialogDescription>
          </DialogHeader>
          <div className="border-b border-border px-4 py-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                data-crypto-search
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search USDT, BTC, Solana…"
                className="w-full rounded-2xl border border-border bg-secondary/40 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
          <div
            className="max-h-[50vh] overflow-y-auto overscroll-contain p-2"
            style={{ WebkitOverflowScrolling: 'touch' }}
            data-testid="crypto-currency-list"
          >
            {filteredAssets.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">No currencies match your search.</p>
            ) : (
              filteredAssets.map((item) => {
                const selected = item.symbol === asset.symbol;
                return (
                  <button
                    key={item.symbol}
                    type="button"
                    data-testid={`crypto-currency-option-${item.symbol}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => selectCoin(item.symbol, event)}
                    className={`mb-1 flex w-full touch-manipulation items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${selected ? 'bg-primary/10' : 'hover:bg-secondary active:bg-secondary'}`}
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
          <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            {WITHDRAW_CRYPTO_ASSETS.length} supported currencies
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={networkOpen} onOpenChange={setNetworkOpen}>
        <DialogContent className="z-[80] max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border px-4 py-4 text-left">
            <DialogTitle>Select network</DialogTitle>
            <DialogDescription>
              Compatible networks for {asset.symbol}.
            </DialogDescription>
          </DialogHeader>
          <div
            className="max-h-[55vh] overflow-y-auto overscroll-contain p-2"
            style={{ WebkitOverflowScrolling: 'touch' }}
            data-testid="crypto-network-list"
          >
            {networks.map((item) => {
              const selected = item.code === (selectedNetwork?.code || network);
              return (
                <button
                  key={item.code}
                  type="button"
                  data-testid={`crypto-network-option-${item.code}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => selectNetwork(item.code, event)}
                  className={`mb-1 flex w-full touch-manipulation items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${selected ? 'bg-primary/10' : 'hover:bg-secondary active:bg-secondary'}`}
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CryptoAssetPicker;
