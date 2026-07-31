import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ShieldCheck, Clock3, CreditCard, ArrowUpRight } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductGridSkeleton } from '../../components/Skeletons';
import { useFetch } from '../../hooks/useFetch';
import { paymentsApi } from '../../services/paymentsApi';
import { ordersApi } from '../../services/ordersApi';
import { PAYMENT_STATUS } from '../../constants/commerce';

const HISTORY_TABS = ['All', 'Paid', 'Pending', 'Failed'];

/**
 * Buyer payments overview. Purchases are paid via Cryptomus at Buy Now —
 * there is no buyer deposit wallet on the production backend.
 */
const WalletPage = () => {
  const [historyTab, setHistoryTab] = useState('All');
  const { data: paymentsData, loading, error, retry } = useFetch(
    () => paymentsApi.list({ page: 1, limit: 100, scope: 'buyer' }),
    [],
  );
  const { data: ordersData } = useFetch(
    () => ordersApi.list({ page: 1, limit: 100, scope: 'buyer' }),
    [],
  );

  const payments = paymentsData?.items || [];
  const orders = ordersData?.items || [];

  const paidTotal = useMemo(
    () => payments.filter((p) => p.status === PAYMENT_STATUS.PAID).reduce((s, p) => s + p.amount, 0),
    [payments],
  );
  const pendingTotal = useMemo(
    () => payments.filter((p) => p.status === PAYMENT_STATUS.PENDING || p.status === PAYMENT_STATUS.PROCESSING).reduce((s, p) => s + p.amount, 0),
    [payments],
  );
  const escrowTotal = useMemo(
    () => orders.filter((o) => o.escrowStatus === 'locked' || o.status === 'escrow').reduce((s, o) => s + o.amount, 0),
    [orders],
  );

  const filteredHistory = useMemo(() => {
    if (historyTab === 'Paid') return payments.filter((p) => p.status === PAYMENT_STATUS.PAID);
    if (historyTab === 'Pending') return payments.filter((p) => p.status === PAYMENT_STATUS.PENDING || p.status === PAYMENT_STATUS.PROCESSING);
    if (historyTab === 'Failed') return payments.filter((p) => ['failed', 'expired', 'cancelled'].includes(p.status));
    return payments;
  }, [payments, historyTab]);

  return (
    <>
      <Seo title="Payments" description="Track your HStock Cryptomus payments, pending invoices, and escrow-protected purchases." noIndex />
      <AccountLayout title="Wallet" subtitle="Cryptomus payments for HStock Buy Now purchases — escrow-protected until release.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-border soft-shadow p-5 hover:soft-shadow-lg transition-shadow">
            <span className="grid place-items-center w-9 h-9 rounded-xl brand-gradient text-white mb-3"><Wallet className="w-4.5 h-4.5" /></span>
            <p className="text-xs font-medium text-muted-foreground">Paid Total</p>
            <p className="text-2xl font-black tracking-tight mt-1">${paidTotal.toFixed(2)}</p>
          </div>
          <div className="relative overflow-hidden bg-white rounded-2xl border border-border soft-shadow p-5 hover:soft-shadow-lg transition-shadow">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary mb-3"><CreditCard className="w-4.5 h-4.5" /></span>
            <p className="text-xs font-medium text-muted-foreground">Payments</p>
            <p className="text-2xl font-black tracking-tight mt-1 text-primary">{payments.length}</p>
          </div>
          <div className="relative overflow-hidden bg-white rounded-2xl border border-border soft-shadow p-5 hover:soft-shadow-lg transition-shadow">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber-100 text-amber-700 mb-3"><ShieldCheck className="w-4.5 h-4.5" /></span>
            <p className="text-xs font-medium text-muted-foreground">Escrow Balance</p>
            <p className="text-2xl font-black tracking-tight mt-1 text-amber-600">${escrowTotal.toFixed(2)}</p>
          </div>
          <div className="relative overflow-hidden bg-white rounded-2xl border border-border soft-shadow p-5 hover:soft-shadow-lg transition-shadow">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-secondary text-muted-foreground mb-3"><Clock3 className="w-4.5 h-4.5" /></span>
            <p className="text-xs font-medium text-muted-foreground">Pending Balance</p>
            <p className="text-2xl font-black tracking-tight mt-1 text-muted-foreground">${pendingTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 mb-6">
          <h3 className="font-bold text-sm mb-1">How payments work</h3>
          <p className="text-xs text-muted-foreground mb-4">
            HStock does not use a buyer deposit wallet. Tap Buy Now on a product, confirm the purchase, and complete payment with Cryptomus. Verified funds move into escrow automatically.
          </p>
          <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Browse marketplace <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto p-4 border-b border-border">
            {HISTORY_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setHistoryTab(t)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${historyTab === t ? 'brand-gradient text-white' : 'bg-secondary/70 hover:bg-secondary'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-6"><ProductGridSkeleton count={3} className="grid grid-cols-1 gap-3" /></div>
          ) : error ? (
            <div className="p-6"><NetworkErrorState onRetry={retry} message={error.message} /></div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No payments yet" message="Cryptomus invoices from Buy Now purchases will appear here." actionLabel="Browse the Shop" actionTo="/shop" />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredHistory.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.orderNumber || p.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.statusLabel}
                      {p.toCurrency ? ` · ${p.toCurrency}` : ''}
                      {p.network ? ` / ${p.network}` : ''}
                      {p.createdAt ? ` · ${new Date(p.createdAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">${p.amount.toFixed(2)}</p>
                    {p.orderNumber && (
                      <Link to={`/orders/${p.orderNumber}`} className="text-xs font-semibold text-primary hover:underline">
                        View order
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AccountLayout>
    </>
  );
};

export default WalletPage;
