import React, { useMemo, useState } from 'react';
import { Wallet, TrendingUp, Clock, Banknote, Loader2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../components/ui/dialog';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';
import { inputClass } from '../../../admin/components/FormSheet';
import { useToast } from '../../../hooks/use-toast';
import { withdrawalsApi } from '../../../services/withdrawalsApi';
import { getDefaultNetworkForCoin, WITHDRAW_CRYPTO_ASSETS } from '../../../constants/cryptoAssets';
import CryptoAssetPicker from '../../../components/CryptoAssetPicker';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const SellerEarningsTab = ({
  wallet,
  transactions = [],
  withdrawals: initialWithdrawals = [],
  onRefresh,
  canWithdraw = true,
  stats = null,
}) => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [coin, setCoin] = useState(WITHDRAW_CRYPTO_ASSETS[0].symbol);
  const [network, setNetwork] = useState(getDefaultNetworkForCoin(WITHDRAW_CRYPTO_ASSETS[0].symbol));
  const [walletAddress, setWalletAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    setWithdrawals(initialWithdrawals);
  }, [initialWithdrawals]);

  const available = wallet?.withdrawableBalance ?? wallet?.availableBalance ?? 0;
  const pending = wallet?.pendingBalance ?? 0;
  const withdrawn = wallet?.totalWithdrawn ?? 0;
  const lifetime = (wallet?.releasedBalance ?? 0) + withdrawn;
  const processing = withdrawals.filter((w) => ['pending', 'approved'].includes(w.status)).length;
  const completed = withdrawals.filter((w) => w.status === 'paid' || w.status === 'completed').length;

  const earningsChart = useMemo(() => {
    const byMonth = new Map();
    transactions.forEach((t) => {
      if (!t.date) return;
      const key = new Date(t.date).toLocaleString(undefined, { month: 'short' });
      const delta = t.direction === 'debit' ? -Number(t.amount || 0) : Number(t.amount || 0);
      byMonth.set(key, (byMonth.get(key) || 0) + Math.max(0, delta));
    });
    return [...byMonth.entries()].slice(-6).map(([month, earnings]) => ({ month, earnings: Math.round(earnings * 100) / 100 }));
  }, [transactions]);

  const submitWithdrawal = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0 || amt > available) return;
    if (!walletAddress.trim()) {
      toast({ title: 'Enter a wallet address', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const created = await withdrawalsApi.create({
        coin,
        network,
        walletAddress: walletAddress.trim(),
        amount: amt,
      });
      setWithdrawals((prev) => [created, ...prev]);
      toast({ title: 'Withdrawal requested', description: `$${amt.toFixed(2)} ${coin} via ${network}.` });
      setAmount('');
      setWalletAddress('');
      setOpen(false);
      await onRefresh?.();
    } catch (err) {
      toast({ title: 'Withdrawal failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[1.75rem] brand-gradient p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Available Balance</p>
            <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{money(available)}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
              <span>Pending {money(pending)}</span>
              <span>Withdrawn {money(withdrawn)}</span>
              <span>Lifetime {money(lifetime)}</span>
              {stats ? <span>Net profit {money(stats.netProfit)}</span> : null}
            </div>
          </div>
          <button
            type="button"
            disabled={!canWithdraw}
            title={canWithdraw ? 'Withdraw earnings' : 'Withdrawals unlock after seller approval'}
            onClick={() => canWithdraw && setOpen(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-sm ${
              canWithdraw
                ? 'bg-white text-primary hover:bg-white/95'
                : 'cursor-not-allowed bg-white/30 text-white/70'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" /> Withdraw
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Available', value: money(available), icon: Wallet },
          { label: 'Pending', value: money(pending), icon: Clock },
          { label: 'Processing', value: processing, icon: ShieldCheck },
          { label: 'Completed', value: completed, icon: Banknote },
        ].map((card) => (
          <div key={card.label} className="rounded-[1.35rem] border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <card.icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Monthly Earnings</h3>
            <p className="mt-1 text-sm text-muted-foreground">Ledger credits from completed commerce activity.</p>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="h-64">
          {earningsChart.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">No ledger activity yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsChart} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`$${v}`, 'Earnings']} />
                <Bar dataKey="earnings" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
          <h3 className="border-b border-border p-5 text-lg font-black">Bank / Crypto Methods</h3>
          <div className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              Withdrawals are paid manually in crypto after admin approval. Choose asset and network when requesting a payout.
            </p>
            <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
              <p className="font-semibold text-foreground">Supported assets</p>
              <p className="mt-1 text-muted-foreground">
                {WITHDRAW_CRYPTO_ASSETS.map((asset) => asset.symbol).join(' · ')}
              </p>
            </div>
            {!canWithdraw ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Withdrawals unlock after your seller account is approved.
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
          <h3 className="border-b border-border p-5 text-lg font-black">Withdrawal History</h3>
          {withdrawals.length === 0 ? (
            <EmptyState icon={Banknote} title="No withdrawals yet" description="Your withdrawal requests will show up here." />
          ) : (
            <ul className="divide-y divide-border">
              {withdrawals.map((w) => (
                <li key={w.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium">{w.coin}/{w.network} · {fmtDate(w.date)}</p>
                    <p className="text-xs text-muted-foreground">{w.requestNumber || w.id}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold">${Number(w.amount || 0).toFixed(2)}</span>
                    <StatusBadge status={w.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
        <h3 className="border-b border-border p-5 text-lg font-black">Transactions</h3>
        {transactions.length === 0 ? (
          <EmptyState icon={Wallet} title="No transactions yet" description="Completed sales will appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(t.date)}</p>
                </div>
                <span className={`font-semibold ${t.direction === 'debit' ? 'text-destructive' : 'text-emerald-600'}`}>
                  {t.direction === 'debit' ? '-' : '+'}${Number(t.amount || 0).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => canWithdraw && setOpen(v)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Withdraw earnings</DialogTitle>
            <DialogDescription>Available balance: {money(available)}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={submitWithdrawal}
            className="space-y-4"
            data-selected-currency={coin}
            data-selected-network={network}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium">Amount ($)</label>
              <div className="flex gap-2">
                <input type="number" step="0.01" min="0" max={available} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="0.00" required />
                <button type="button" onClick={() => setAmount(String(available))} className="rounded-full border border-border px-4 text-xs font-bold hover:bg-secondary">
                  MAX
                </button>
              </div>
            </div>
            <CryptoAssetPicker
              coin={coin}
              network={network}
              onCoinChange={setCoin}
              onNetworkChange={setNetwork}
              disabled={submitting}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Wallet address</label>
              <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className={inputClass} placeholder="Paste your payout address" required />
            </div>
            <p className="text-xs text-muted-foreground">
              Request will submit <span className="font-semibold text-foreground">{coin}</span> on{' '}
              <span className="font-semibold text-foreground">{network}</span>. Admin review is required before payout.
            </p>
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !amount || Number(amount) <= 0 || Number(amount) > available || !coin || !network} className="inline-flex items-center gap-2 rounded-full brand-gradient px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Request Withdrawal
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerEarningsTab;
