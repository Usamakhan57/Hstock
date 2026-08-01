import React, { useEffect, useState } from 'react';
import { Wallet, Download, Snowflake, Sun } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import {
  getWalletLedger,
  getBuyerWallet,
  adjustBuyerWallet,
  freezeBuyerWallet,
  unfreezeBuyerWallet,
  listBuyerWalletTransactions,
  exportBuyerWalletCsvUrl,
} from '../../api/wallets';
import { getAccessToken } from '../../../lib/tokenStorage';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const WalletsList = () => {
  const [tab, setTab] = useState('ledger');
  const [entries, setEntries] = useState([]);
  const [buyerTx, setBuyerTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyerId, setBuyerId] = useState('');
  const [buyerWallet, setBuyerWallet] = useState(null);
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('Admin adjustment');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'ledger') {
        const rows = await getWalletLedger();
        setEntries(rows);
      } else {
        const { items } = await listBuyerWalletTransactions({
          page: 1,
          limit: 100,
          q: search || undefined,
        });
        setBuyerTx(items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const loadBuyer = async () => {
    if (!buyerId.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const data = await getBuyerWallet(buyerId.trim());
      setBuyerWallet(data);
    } catch (err) {
      setMessage(err.message || 'Buyer wallet not found');
      setBuyerWallet(null);
    } finally {
      setBusy(false);
    }
  };

  const runAdjust = async (direction) => {
    if (!buyerId.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      await adjustBuyerWallet({
        buyerId: buyerId.trim(),
        amount: Number(amount),
        direction,
        reason,
      });
      await loadBuyer();
      setMessage(`Buyer wallet ${direction} applied`);
      if (tab === 'buyer') await load();
    } catch (err) {
      setMessage(err.message || 'Adjustment failed');
    } finally {
      setBusy(false);
    }
  };

  const runFreeze = async (freeze) => {
    if (!buyerId.trim()) return;
    setBusy(true);
    try {
      if (freeze) await freezeBuyerWallet(buyerId.trim(), reason || 'Frozen by admin');
      else await unfreezeBuyerWallet(buyerId.trim());
      await loadBuyer();
      setMessage(freeze ? 'Wallet frozen' : 'Wallet unfrozen');
    } catch (err) {
      setMessage(err.message || 'Freeze action failed');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    const url = exportBuyerWalletCsvUrl({ q: search || undefined, limit: 5000 });
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${getAccessToken() || ''}` },
      credentials: 'include',
    });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'buyer-wallet-transactions.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <PageHeader
        title="Wallets"
        description={tab === 'ledger' ? `${entries.length} seller ledger entries` : `${buyerTx.length} buyer wallet transactions`}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => setTab('ledger')} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${tab === 'ledger' ? 'bg-primary text-white border-primary' : 'bg-white border-border'}`}>Seller ledger</button>
        <button type="button" onClick={() => setTab('buyer')} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${tab === 'buyer' ? 'bg-primary text-white border-primary' : 'bg-white border-border'}`}>Buyer wallets</button>
      </div>

      {tab === 'buyer' && (
        <div className="mb-6 rounded-2xl border border-border bg-white p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              placeholder="Buyer user id"
              className="flex-1 h-10 rounded-xl border border-border px-3 text-sm"
            />
            <button type="button" disabled={busy} onClick={loadBuyer} className="h-10 px-4 rounded-xl brand-gradient text-white text-sm font-semibold">Load wallet</button>
            <button type="button" onClick={exportCsv} className="h-10 px-4 rounded-xl border border-border text-sm font-semibold inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0.01" step="0.01" className="h-10 w-32 rounded-xl border border-border px-3 text-sm" />
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="flex-1 h-10 rounded-xl border border-border px-3 text-sm" placeholder="Reason" />
            <button type="button" disabled={busy} onClick={() => runAdjust('credit')} className="h-10 px-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Credit</button>
            <button type="button" disabled={busy} onClick={() => runAdjust('debit')} className="h-10 px-3 rounded-xl bg-destructive text-white text-sm font-semibold">Debit</button>
            <button type="button" disabled={busy} onClick={() => runFreeze(true)} className="h-10 px-3 rounded-xl border border-border text-sm font-semibold inline-flex items-center gap-1"><Snowflake className="w-4 h-4" /> Freeze</button>
            <button type="button" disabled={busy} onClick={() => runFreeze(false)} className="h-10 px-3 rounded-xl border border-border text-sm font-semibold inline-flex items-center gap-1"><Sun className="w-4 h-4" /> Unfreeze</button>
          </div>
          {buyerWallet?.wallet && (
            <p className="text-sm">
              {buyerWallet.user?.email} · available {fmtMoney(buyerWallet.wallet.availableBalance)} · pending {fmtMoney(buyerWallet.wallet.pendingBalance)}
              {buyerWallet.wallet.frozen ? ' · FROZEN' : ''}
            </p>
          )}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions" className="flex-1 h-10 rounded-xl border border-border px-3 text-sm" />
            <button type="button" onClick={load} className="h-10 px-4 rounded-xl border border-border text-sm font-semibold">Search</button>
          </div>
        </div>
      )}

      {tab === 'ledger' ? (
        <DataTable
          isLoading={loading}
          data={entries}
          searchKeys={['sellerName', 'description', 'entryType']}
          filters={[
            { key: 'direction', label: 'Direction', options: [{ value: 'credit', label: 'Credit' }, { value: 'debit', label: 'Debit' }] },
          ]}
          columns={[
            { key: 'sellerName', label: 'Seller' },
            { key: 'entryType', label: 'Type' },
            { key: 'direction', label: 'Direction', render: (row) => <span className="capitalize">{row.direction || '—'}</span> },
            { key: 'amount', label: 'Amount', render: (row) => fmtMoney(row.amount) },
            { key: 'description', label: 'Description' },
            { key: 'createdAt', label: 'Date', render: (row) => fmtDate(row.createdAt) },
          ]}
          emptyState={{ icon: Wallet, title: 'No ledger entries' }}
        />
      ) : (
        <DataTable
          isLoading={loading}
          data={buyerTx}
          searchKeys={['buyerEmail', 'reference', 'description', 'type']}
          columns={[
            { key: 'buyerEmail', label: 'Buyer' },
            { key: 'type', label: 'Type' },
            { key: 'direction', label: 'Direction' },
            { key: 'amount', label: 'Amount', render: (row) => fmtMoney(row.amount) },
            { key: 'status', label: 'Status' },
            { key: 'reference', label: 'Reference' },
            { key: 'createdAt', label: 'Date', render: (row) => fmtDate(row.createdAt) },
          ]}
          emptyState={{ icon: Wallet, title: 'No buyer wallet transactions' }}
        />
      )}
    </div>
  );
};

export default WalletsList;
