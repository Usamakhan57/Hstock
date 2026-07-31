import React, { useState } from 'react';
import { Wallet, TrendingUp, Clock, Banknote } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../components/ui/dialog';
import StatCard from '../../../admin/components/StatCard';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';
import { inputClass } from '../../../admin/components/FormSheet';
import { useToast } from '../../../hooks/use-toast';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const SellerEarningsTab = ({ transactions, earningsChart, withdrawals: initialWithdrawals }) => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const lifetime = transactions.reduce((s, t) => s + t.amount, 0);
  const pending = withdrawals.filter((w) => w.status === 'processing').reduce((s, w) => s + w.amount, 0);
  const withdrawn = withdrawals.filter((w) => w.status === 'completed').reduce((s, w) => s + w.amount, 0);
  const available = Math.max(0, lifetime - pending - withdrawn);

  const submitWithdrawal = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0 || amt > available) return;
    setWithdrawals((prev) => [
      { id: `WD-${1000 + prev.length + 3}`, date: new Date().toISOString(), amount: amt, method: 'PayPal', status: 'processing' },
      ...prev,
    ]);
    toast({ title: 'Withdrawal requested', description: `$${amt.toFixed(2)} is on its way to your payout account.` });
    setAmount('');
    setOpen(false);
  };

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Available Balance" value={`$${available.toFixed(2)}`} icon={Wallet} />
        <StatCard label="Pending" value={`$${pending.toFixed(2)}`} icon={Clock} />
        <StatCard label="Lifetime Earnings" value={`$${lifetime.toFixed(2)}`} icon={TrendingUp} trend={9} />
        <StatCard label="Withdrawn" value={`$${withdrawn.toFixed(2)}`} icon={Banknote} />
      </div>

      <div className="bg-white rounded-3xl border border-border soft-shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Monthly Earnings</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <button onClick={() => setOpen(true)} className="brand-gradient text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-95 transition-all">
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
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={available}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
                <DialogFooter>
                  <button type="button" onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border hover:bg-secondary transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={!amount || Number(amount) <= 0 || Number(amount) > available} className="px-5 py-2.5 rounded-full text-sm font-semibold brand-gradient text-white disabled:opacity-60">
                    Request Withdrawal
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningsChart} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`$${v}`, 'Earnings']} />
              <Bar dataKey="earnings" fill="#6C3BFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
                  <span className="font-semibold text-emerald-600">+${t.amount.toFixed(2)}</span>
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
                    <p className="font-medium">{w.method} · {fmtDate(w.date)}</p>
                    <p className="text-xs text-muted-foreground">{w.id}</p>
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
