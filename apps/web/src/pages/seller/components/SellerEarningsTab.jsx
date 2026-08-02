import React, { useMemo, useState } from 'react';
import { Wallet, TrendingUp, Clock, Banknote, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../components/ui/dialog';
import StatCard from '../../../admin/components/StatCard';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';
import { inputClass } from '../../../admin/components/FormSheet';
import { useToast } from '../../../hooks/use-toast';
import { withdrawalsApi } from '../../../services/withdrawalsApi';
import { getDefaultNetworkForCoin, WITHDRAW_CRYPTO_ASSETS } from '../../../constants/cryptoAssets';
import CryptoAssetPicker from '../../../components/CryptoAssetPicker';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const SellerEarningsTab = ({
  wallet,
  transactions = [],
  withdrawals: initialWithdrawals = [],
  onRefresh,
  canWithdraw = true,
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
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Available Balance" value={`$${available.toFixed(2)}`} icon={Wallet} />
        <StatCard label="Pending" value={`$${pending.toFixed(2)}`} icon={Clock} />
        <StatCard label="Lifetime Earnings" value={`$${lifetime.toFixed(2)}`} icon={TrendingUp} />
        <StatCard label="Withdrawn" value={`$${withdrawn.toFixed(2)}`} icon={Banknote} />
      </div>

      <div className="bg-white rounded-3xl border border-border soft-shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="font-bold">Monthly Earnings</h3>
          <Dialog open={open} onOpenChange={(v) => canWithdraw && setOpen(v)}>
            <button
              type="button"
              disabled={!canWithdraw}
              title={canWithdraw ? 'Withdraw earnings' : 'Withdrawals unlock after seller approval'}
              onClick={() => canWithdraw && setOpen(true)}
              className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all ${
                canWithdraw
                  ? 'brand-gradient text-white hover:opacity-95'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed'
              }`}
            >
              Withdraw
            </button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw earnings</DialogTitle>
                <DialogDescription>Available balance: ${available.toFixed(2)}</DialogDescription>
              </DialogHeader>
              <form onSubmit={submitWithdrawal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount ($)</label>
                  <input type="number" step="0.01" min="0" max={available} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="0.00" required />
                </div>
                <CryptoAssetPicker
                  coin={coin}
                  network={network}
                  onCoinChange={setCoin}
                  onNetworkChange={setNetwork}
                  disabled={submitting}
                />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Wallet address</label>
                  <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className={inputClass} placeholder="Paste your payout address" required />
                </div>
                <DialogFooter>
                  <button type="button" onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border hover:bg-secondary transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || !amount || Number(amount) <= 0 || Number(amount) > available} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold brand-gradient text-white disabled:opacity-60">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Request Withdrawal
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="h-64">
          {earningsChart.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">No ledger activity yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsChart} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`$${v}`, 'Earnings']} />
                <Bar dataKey="earnings" fill="#6C3BFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
          <h3 className="font-bold p-5 pb-3">Transactions</h3>
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

        <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
          <h3 className="font-bold p-5 pb-3">Withdrawal History</h3>
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
                    <span className="font-semibold">${w.amount.toFixed(2)}</span>
                    <StatusBadge status={w.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerEarningsTab;
