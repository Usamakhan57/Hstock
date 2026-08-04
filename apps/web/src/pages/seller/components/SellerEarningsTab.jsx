import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, TrendingUp, Clock, Banknote, Loader2, ArrowUpRight, ShieldCheck,
  Plus, RefreshCw, Copy, ExternalLink, CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../components/ui/dialog';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';
import { inputClass } from '../../../admin/components/FormSheet';
import TelegramConnectSection from '../../../components/telegram/TelegramConnectSection';
import { useToast } from '../../../hooks/use-toast';
import { withdrawalsApi } from '../../../services/withdrawalsApi';
import { buyerWalletApi } from '../../../services/buyerWalletApi';
import { getDefaultNetworkForCoin, WITHDRAW_CRYPTO_ASSETS } from '../../../constants/cryptoAssets';
import CryptoAssetPicker from '../../../components/CryptoAssetPicker';
import { clearRequestCache } from '../../../lib/requestCache';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const PENDING_STATUSES = new Set(['pending', 'processing', 'check', 'confirm_check']);

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

  const [depositAmount, setDepositAmount] = useState('25');
  const [funding, setFunding] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [depositsLoading, setDepositsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState(null);

  React.useEffect(() => {
    setWithdrawals(initialWithdrawals);
  }, [initialWithdrawals]);

  const loadDeposits = useCallback(async () => {
    setDepositsLoading(true);
    try {
      const result = await buyerWalletApi.listDeposits({
        page: 1,
        limit: 20,
        creditToSellerWallet: 'true',
      });
      setDeposits(result.items || []);
    } catch {
      setDeposits([]);
    } finally {
      setDepositsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  const available = wallet?.withdrawableBalance ?? wallet?.availableBalance ?? 0;
  const pending = wallet?.pendingBalance ?? 0;
  const withdrawn = wallet?.totalWithdrawn ?? 0;
  const lifetime = (wallet?.releasedBalance ?? 0) + withdrawn;
  const processing = withdrawals.filter((w) => ['pending', 'approved'].includes(w.status)).length;
  const completed = withdrawals.filter((w) => w.status === 'paid' || w.status === 'completed').length;

  const pendingDeposits = useMemo(
    () => deposits.filter((d) => PENDING_STATUSES.has(String(d.status || '').toLowerCase())),
    [deposits],
  );
  const completedDeposits = useMemo(
    () => deposits.filter((d) => String(d.status || '').toLowerCase() === 'paid'),
    [deposits],
  );

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

  const returnUrls = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const earningsUrl = `${origin}/seller/earnings`;
    return { urlReturn: earningsUrl, urlSuccess: earningsUrl };
  }, []);

  const startFunding = async (purpose) => {
    const value = Number(depositAmount);
    if (!(value > 0)) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setFunding(true);
    try {
      const payload = {
        amount: value,
        creditToSellerWallet: true,
        ...returnUrls,
      };
      const result = purpose === 'topup'
        ? await buyerWalletApi.topup(payload)
        : await buyerWalletApi.deposit(payload);
      await loadDeposits();
      if (result.paymentUrl) {
        toast({
          title: purpose === 'topup' ? 'Redirecting to top-up' : 'Redirecting to deposit',
          description: 'Complete Cryptomus payment to credit your seller wallet.',
        });
        window.location.assign(result.paymentUrl);
        return;
      }
      toast({
        title: 'Invoice created',
        description: result.cryptomus?.simulated
          ? 'Simulated invoice ready — use Refresh after confirming payment.'
          : 'Could not open payment page. Use the pending deposit actions below.',
      });
    } catch (err) {
      toast({
        title: 'Unable to start funding',
        description: err.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setFunding(false);
    }
  };

  const refreshDeposit = async (depositId) => {
    if (!depositId || refreshingId) return;
    setRefreshingId(depositId);
    try {
      const result = await buyerWalletApi.refreshDeposit(depositId);
      clearRequestCache('wallet');
      clearRequestCache('wallet-tx');
      await loadDeposits();
      await onRefresh?.({ force: true });
      const credited = result?.deposit?.status === 'paid' || result?.alreadyCredited;
      toast({
        title: credited ? 'Payment confirmed' : 'Status refreshed',
        description: credited
          ? 'Seller wallet balance updated from Cryptomus deposit.'
          : 'Deposit is still awaiting Cryptomus confirmation.',
      });
    } catch (err) {
      toast({
        title: 'Refresh failed',
        description: err.message || 'Could not refresh deposit',
        variant: 'destructive',
      });
    } finally {
      setRefreshingId(null);
    }
  };

  const copyAddress = async (address) => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast({ title: 'Address copied' });
    } catch {
      toast({ title: 'Could not copy address', variant: 'destructive' });
    }
  };

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
      await onRefresh?.({ force: true });
    } catch (err) {
      toast({ title: 'Withdrawal failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderDepositRow = (d) => {
    const status = String(d.status || '').toLowerCase();
    const isPending = PENDING_STATUSES.has(status);
    const paymentUrl = d.paymentUrl || d.invoiceUrl;
    const address = d.address;
    const id = d.id || d._id;

    return (
      <li key={id} className="flex flex-col gap-3 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">
            {money(d.amount)} · {d.purpose === 'topup' ? 'Top-up' : 'Deposit'}
          </p>
          <p className="text-xs text-muted-foreground">
            {d.depositNumber || id} · {fmtDateTime(d.createdAt || d.paidAt)}
          </p>
          {address ? (
            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{address}</p>
          ) : null}
          {d.sellerWalletCredited || d.metadata?.sellerWalletCreditedAt ? (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Credited to seller wallet
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {address ? (
            <button
              type="button"
              onClick={() => copyAddress(address)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          ) : null}
          {paymentUrl ? (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              <ExternalLink className="h-3 w-3" /> Pay
            </a>
          ) : null}
          {isPending || status === 'paid' ? (
            <button
              type="button"
              disabled={refreshingId === id}
              onClick={() => refreshDeposit(id)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
            >
              {refreshingId === id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Refresh
            </button>
          ) : null}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Telegram Connection */}
      <TelegramConnectSection
        compact
        pollUntilConnected
        title="Telegram Connection"
        description="Connect Telegram to receive order and payout alerts."
      />

      {/* 2. Wallet Balance */}
      <div className="overflow-hidden rounded-[1.75rem] brand-gradient p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Wallet Balance</p>
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
            onClick={() => {
              clearRequestCache('wallet');
              onRefresh?.({ force: true });
              loadDeposits();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-bold text-white hover:bg-white/25"
          >
            <RefreshCw className="h-4 w-4" /> Refresh balance
          </button>
        </div>
      </div>

      {/* 3. Deposit / Top Up Wallet */}
      <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-black">Deposit / Top Up Wallet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Same Cryptomus funding as the buyer wallet. After payment is verified, funds credit your seller wallet automatically.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">$</span>
            <input
              type="number"
              min="5"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-secondary/40 pl-8 pr-4 text-sm font-semibold outline-none focus:border-primary"
              placeholder="Amount"
            />
          </div>
          <button
            type="button"
            disabled={funding}
            onClick={() => startFunding('deposit')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl brand-gradient px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {funding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Deposit
          </button>
          <button
            type="button"
            disabled={funding}
            onClick={() => startFunding('topup')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-5 text-sm font-semibold disabled:opacity-50"
          >
            Top Up
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h4 className="text-sm font-bold">Pending deposits</h4>
              <button
                type="button"
                onClick={loadDeposits}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Reload
              </button>
            </div>
            {depositsLoading ? (
              <div className="grid place-items-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : pendingDeposits.length === 0 ? (
              <EmptyState icon={Clock} title="No pending deposits" description="New Cryptomus invoices appear here until paid." />
            ) : (
              <ul className="divide-y divide-border">{pendingDeposits.map(renderDepositRow)}</ul>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <h4 className="border-b border-border px-4 py-3 text-sm font-bold">Completed deposits</h4>
            {depositsLoading ? (
              <div className="grid place-items-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : completedDeposits.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No completed deposits yet" description="Successful Cryptomus payments show here." />
            ) : (
              <ul className="divide-y divide-border">{completedDeposits.map(renderDepositRow)}</ul>
            )}
          </div>
        </div>
      </div>

      {/* 4. Recent Wallet Transactions */}
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
        <h3 className="border-b border-border p-5 text-lg font-black">Recent Wallet Transactions</h3>
        {transactions.length === 0 ? (
          <EmptyState icon={Wallet} title="No transactions yet" description="Deposits, sales, promotions, and withdrawals appear here." />
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

      {/* 5. Withdraw Balance */}
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black">Withdraw Balance</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Available to withdraw: {money(available)}. Paid manually in crypto after admin approval.
            </p>
          </div>
          <button
            type="button"
            disabled={!canWithdraw}
            title={canWithdraw ? 'Withdraw earnings' : 'Withdrawals unlock after seller approval'}
            onClick={() => canWithdraw && setOpen(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-sm ${
              canWithdraw
                ? 'brand-gradient text-white hover:opacity-95'
                : 'cursor-not-allowed bg-secondary text-muted-foreground'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" /> Withdraw
          </button>
        </div>
        {!canWithdraw ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Withdrawals unlock after your seller account is approved.
          </div>
        ) : null}
        <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
          <p className="font-semibold text-foreground">Supported assets</p>
          <p className="mt-1 text-muted-foreground">
            {WITHDRAW_CRYPTO_ASSETS.map((asset) => asset.symbol).join(' · ')}
          </p>
        </div>
      </div>

      {/* 6. Dashboard Statistics */}
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

      {/* 7. Remaining sections */}
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
