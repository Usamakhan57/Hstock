import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, ShieldCheck, Clock3, ArrowUpRight, Plus, RefreshCw, Loader2,
} from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductGridSkeleton } from '../../components/Skeletons';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/use-toast';
import { buyerWalletApi } from '../../services/buyerWalletApi';
import { paymentsApi } from '../../services/paymentsApi';
import { PAYMENT_STATUS } from '../../constants/commerce';

const HISTORY_TABS = ['All', 'Deposit', 'Topup', 'Purchase', 'Refund', 'Adjustment'];

const WalletPage = () => {
  const { toast } = useToast();
  const [historyTab, setHistoryTab] = useState('All');
  const [amount, setAmount] = useState('25');
  const [funding, setFunding] = useState(false);
  const {
    data: wallet,
    loading,
    error,
    retry,
  } = useFetch(() => buyerWalletApi.getWallet(), []);
  const { data: historyData, retry: retryHistory } = useFetch(
    () => buyerWalletApi.getHistory({ page: 1, limit: 50 }),
    [],
  );
  const { data: paymentsData } = useFetch(
    () => paymentsApi.list({ page: 1, limit: 20, scope: 'buyer' }),
    [],
  );

  const history = historyData?.items || [];
  const payments = paymentsData?.items || [];
  const pendingPayments = payments.filter((p) => (
    p.status === PAYMENT_STATUS.PENDING || p.status === PAYMENT_STATUS.PROCESSING
  ));

  const filteredHistory = useMemo(() => {
    if (historyTab === 'All') return history;
    return history.filter((tx) => String(tx.type).toLowerCase() === historyTab.toLowerCase());
  }, [history, historyTab]);

  const startFunding = async (purpose) => {
    const value = Number(amount);
    if (!(value > 0)) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setFunding(true);
    try {
      const result = purpose === 'topup'
        ? await buyerWalletApi.topup({ amount: value })
        : await buyerWalletApi.deposit({ amount: value });
      if (result.paymentUrl) {
        toast({
          title: purpose === 'topup' ? 'Redirecting to top-up' : 'Redirecting to deposit',
          description: 'Complete Cryptomus payment to credit your wallet.',
        });
        window.location.assign(result.paymentUrl);
        return;
      }
      toast({ title: 'Invoice unavailable', description: 'Could not create Cryptomus invoice.', variant: 'destructive' });
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

  return (
    <>
      <Seo title="Wallet" description="ApnaStore buyer wallet — deposit, top up, and pay with Cryptomus-funded balance." noIndex />
      <AccountLayout title="Wallet" subtitle="Prepaid balance funded by Cryptomus. Use it at checkout or keep paying with Cryptomus directly.">
        {loading ? (
          <ProductGridSkeleton count={4} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" />
        ) : error ? (
          <NetworkErrorState onRetry={() => { retry(); retryHistory(); }} message={error.message} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-border soft-shadow p-5">
                <span className="grid place-items-center w-9 h-9 rounded-xl brand-gradient text-white mb-3"><Wallet className="w-4.5 h-4.5" /></span>
                <p className="text-xs font-medium text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-black tracking-tight mt-1">${Number(wallet?.availableBalance || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-border soft-shadow p-5">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber-100 text-amber-700 mb-3"><Clock3 className="w-4.5 h-4.5" /></span>
                <p className="text-xs font-medium text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-black tracking-tight mt-1 text-amber-600">${Number(wallet?.pendingBalance || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-border soft-shadow p-5">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary mb-3"><ShieldCheck className="w-4.5 h-4.5" /></span>
                <p className="text-xs font-medium text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-black tracking-tight mt-1">${Number(wallet?.balance || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-border soft-shadow p-5">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-secondary text-muted-foreground mb-3"><RefreshCw className="w-4.5 h-4.5" /></span>
                <p className="text-xs font-medium text-muted-foreground">Currency</p>
                <p className="text-2xl font-black tracking-tight mt-1">{wallet?.currency || 'USD'}</p>
              </div>
            </div>

            {wallet?.frozen ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Wallet frozen{wallet.frozenReason ? `: ${wallet.frozenReason}` : ''}. Contact support to restore access.
              </div>
            ) : null}

            <div className="bg-white rounded-3xl border border-border soft-shadow p-5 sm:p-6 mb-6">
              <h2 className="font-bold text-lg mb-2">Deposit / Top Up with Cryptomus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Cryptomus is the only funding method. After payment is verified, your available balance updates automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                  <input
                    type="number"
                    min="5"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-border bg-secondary/40 pl-8 pr-4 text-sm font-semibold outline-none focus:border-primary"
                    placeholder="Amount"
                  />
                </div>
                <button
                  type="button"
                  disabled={funding || wallet?.frozen}
                  onClick={() => startFunding('deposit')}
                  className="h-12 px-5 rounded-2xl brand-gradient text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {funding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Deposit
                </button>
                <button
                  type="button"
                  disabled={funding || wallet?.frozen}
                  onClick={() => startFunding('topup')}
                  className="h-12 px-5 rounded-2xl border border-border bg-secondary font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Top Up
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-lg">Transaction History</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {HISTORY_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setHistoryTab(tab)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${historyTab === tab ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted-foreground'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden">
                  {filteredHistory.length === 0 ? (
                    <EmptyState title="No wallet transactions yet" message="Deposits, purchases, and refunds will appear here." />
                  ) : filteredHistory.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-4">
                      <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${tx.direction === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-primary'}`}>
                        <ArrowUpRight className={`w-4 h-4 ${tx.direction === 'debit' ? 'rotate-90' : ''}`} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold capitalize truncate">{tx.type} · {tx.status}</p>
                        <p className="text-xs text-muted-foreground truncate">{tx.reference || tx.description}</p>
                        <p className="text-[11px] text-muted-foreground">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}</p>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${tx.direction === 'credit' ? 'text-emerald-600' : ''}`}>
                        {tx.direction === 'credit' ? '+' : '-'}${Number(tx.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-lg">Recent / Pending Payments</h2>
                  <Link to="/orders" className="text-sm font-semibold text-primary">Orders</Link>
                </div>
                <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden mb-4">
                  {payments.slice(0, 6).length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground">Cryptomus order payments will show here.</p>
                  ) : payments.slice(0, 6).map((p) => (
                    <Link key={p.id} to={p.orderNumber ? `/orders/${p.orderNumber}` : '/orders'} className="flex items-center gap-3 p-4 hover:bg-secondary/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.orderNumber || p.id}</p>
                        <p className="text-xs text-muted-foreground">{p.statusLabel || p.status}</p>
                      </div>
                      <span className="text-sm font-bold">${Number(p.amount || 0).toFixed(2)}</span>
                    </Link>
                  ))}
                </div>
                <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
                  <p className="font-semibold mb-1">Pending invoices</p>
                  <p className="text-muted-foreground">{pendingPayments.length} Cryptomus payment(s) awaiting confirmation.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </AccountLayout>
    </>
  );
};

export default WalletPage;
