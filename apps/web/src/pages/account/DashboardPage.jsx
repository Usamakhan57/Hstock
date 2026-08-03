import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Wallet, CheckCircle2, AlertTriangle, ArrowRight, MessageCircle, Bell } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import ProductCard from '../../components/ProductCard';
import TelegramConnectSection from '../../components/telegram/TelegramConnectSection';
import { PRODUCT_GRID_CLASS } from '../../lib/productGrid';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductGridSkeleton } from '../../components/Skeletons';
import { useStore } from '../../context/StoreContext';
import { useFetch } from '../../hooks/useFetch';
import { ordersApi } from '../../services/ordersApi';
import { paymentsApi } from '../../services/paymentsApi';
import { buyerWalletApi } from '../../services/buyerWalletApi';
import { buildRecentlyViewed, buildRecommended } from '../../services/buyerDashboard';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../constants/commerce';

const STAT_TONES = {
  primary: 'brand-gradient text-white',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  destructive: 'bg-destructive/10 text-destructive',
};

const cardInteraction =
  'transition-all duration-200 hover:soft-shadow-lg hover:border-primary/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const StatCard = ({ label, value, icon: Icon, tone = 'primary', to }) => {
  const body = (
    <>
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-sm font-medium text-muted-foreground truncate">{label}</span>
        <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${STAT_TONES[tone]}`}>
          <Icon className="w-4.5 h-4.5" />
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-black tracking-tight break-words">{value}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`block bg-white rounded-2xl border border-border p-4 sm:p-5 soft-shadow ${cardInteraction}`}>
        {body}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 soft-shadow">
      {body}
    </div>
  );
};

const SectionHeader = ({ title, to }) => (
  <div className="flex items-center justify-between gap-3 mb-4">
    <h2 className="font-bold text-lg min-w-0 truncate">{title}</h2>
    {to && (
      <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-1.5 transition-all shrink-0">
        View all <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    )}
  </div>
);

const DashboardPage = () => {
  const { user, notifications } = useStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { data: ordersData, loading, error, retry } = useFetch(
    () => ordersApi.list({ page: 1, limit: 50, scope: 'buyer' }),
    [],
  );
  const { data: paymentsData } = useFetch(
    () => paymentsApi.list({ page: 1, limit: 50, scope: 'buyer' }),
    [],
  );
  const { data: wallet } = useFetch(() => buyerWalletApi.getWallet(), []);
  const { data: walletHistory } = useFetch(
    () => buyerWalletApi.getHistory({ page: 1, limit: 5 }),
    [],
  );

  const orders = ordersData?.items || [];
  const payments = paymentsData?.items || [];
  const recentlyViewed = useMemo(() => buildRecentlyViewed(), []);
  const recommended = useMemo(() => buildRecommended(), []);

  const activeOrders = orders.filter((o) => [
    ORDER_STATUS.PENDING_PAYMENT,
    ORDER_STATUS.PAYMENT_PROCESSING,
    ORDER_STATUS.PAID,
    ORDER_STATUS.ESCROW,
    ORDER_STATUS.DELIVERED,
  ].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED);
  const paidTotal = payments
    .filter((p) => p.status === PAYMENT_STATUS.PAID)
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter((p) => (
    p.status === PAYMENT_STATUS.PENDING || p.status === PAYMENT_STATUS.PROCESSING
  ));

  return (
    <>
      <Seo title="Dashboard" description="Your ApnaStore buyer dashboard overview." noIndex />
      <AccountLayout title="Dashboard" subtitle={`Welcome back${user?.name ? `, ${user.name}` : ''} — here's what's happening with your account.`}>
        {/* Telegram Connection — same component/API as Seller Dashboard */}
        <div className="mb-6" data-testid="buyer-telegram-connection">
          <TelegramConnectSection
            compact
            pollUntilConnected
            title="Telegram Connection"
            description="Connect Telegram to receive order, wallet, delivery, and dispute alerts."
            connectLabel="Connect Telegram"
          />
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8" />
        ) : error ? (
          <NetworkErrorState onRetry={retry} message={error.message} />
        ) : (
          <>
            {/* Wallet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <Link
                to="/wallet"
                aria-label="Open wallet"
                className={`bg-white rounded-3xl border border-border soft-shadow p-4 sm:p-5 ${cardInteraction}`}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Wallet
                </div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight mt-2">${Number(wallet?.availableBalance || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending ${Number(wallet?.pendingBalance || 0).toFixed(2)} · {wallet?.currency || 'USD'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="h-9 px-3 rounded-2xl brand-gradient text-white text-xs font-semibold inline-flex items-center">Deposit</span>
                  <span className="h-9 px-3 rounded-2xl border border-border bg-secondary text-xs font-semibold inline-flex items-center">Top Up</span>
                  <span className="h-9 px-3 rounded-2xl border border-border text-xs font-semibold inline-flex items-center">History</span>
                </div>
              </Link>

              <Link
                to="/notifications"
                aria-label="Open alerts"
                className={`bg-white rounded-3xl border border-border soft-shadow p-4 sm:p-5 ${cardInteraction}`}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Bell className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Alerts
                </div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight mt-2">{unreadCount} unread</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notifications.length === 0 ? "You're all caught up." : 'Tap to review notifications'}
                </p>
                <div className="mt-4">
                  <span className="h-9 px-3 rounded-2xl border border-border bg-secondary text-xs font-semibold inline-flex items-center gap-1.5">
                    Open notifications <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="min-w-0">
                <SectionHeader title="Recent Orders" to="/orders" />
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-white rounded-3xl border border-border p-6">No orders yet — your purchases will show up here.</p>
                ) : (
                  <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden">
                    {orders.slice(0, 4).map((o) => (
                      <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center gap-3 p-4 hover:bg-secondary/40 active:bg-secondary/60 transition-colors min-w-0">
                        {o.product.img ? <img src={o.product.img} alt="" className="w-12 h-12 rounded-xl object-cover bg-secondary shrink-0" /> : <span className="w-12 h-12 rounded-xl bg-secondary shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{o.product.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{o.id} · {o.date ? new Date(o.date).toLocaleDateString() : '—'}</p>
                        </div>
                        <span className="text-sm font-bold shrink-0">${o.amount.toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <SectionHeader title="Payment activity" to="/wallet" />
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-white rounded-3xl border border-border p-6">Cryptomus payment activity will show up here after your first purchase.</p>
                ) : (
                  <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden">
                    {payments.slice(0, 4).map((p) => (
                      <Link key={p.id} to={p.orderNumber ? `/orders/${p.orderNumber}` : '/wallet'} className="flex items-center gap-3 p-4 hover:bg-secondary/40 active:bg-secondary/60 transition-colors min-w-0">
                        <span className="w-9 h-9 rounded-full bg-secondary grid place-items-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.orderNumber || p.id}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.statusLabel}</p>
                        </div>
                        <span className="text-sm font-bold shrink-0">${p.amount.toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Analytics */}
            <div className="mb-2">
              <SectionHeader title="Analytics" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard label="Active Orders" value={activeOrders.length} icon={Package} tone="primary" to="/orders" />
              <StatCard label="Completed Orders" value={completedOrders.length} icon={CheckCircle2} tone="emerald" to="/orders" />
              <StatCard label="Wallet / Paid" value={`$${Number(wallet?.availableBalance || paidTotal || 0).toFixed(2)}`} icon={Wallet} tone="amber" to="/wallet" />
              <StatCard label="Pending Payments" value={pendingPayments.length} icon={AlertTriangle} tone="destructive" to="/wallet" />
            </div>

            {(walletHistory?.items || []).length > 0 && (
              <div className="mb-8">
                <SectionHeader title="Recent wallet activity" to="/wallet" />
                <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden">
                  {walletHistory.items.slice(0, 4).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-4 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold capitalize truncate">{tx.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{tx.reference || tx.description}</p>
                      </div>
                      <span className="text-sm font-bold shrink-0">
                        {tx.direction === 'credit' ? '+' : '-'}${Number(tx.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-10">
              <SectionHeader title="Recent Purchases" to="/downloads" />
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-white rounded-3xl border border-border p-6">Files you purchase will appear here.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {orders.slice(0, 4).map((o) => (
                    <div key={o.id} className="bg-white rounded-3xl border border-border soft-shadow p-4 flex items-center gap-3 min-w-0">
                      {o.product.img ? <img src={o.product.img} alt="" className="w-12 h-12 rounded-xl object-cover bg-secondary shrink-0" /> : <span className="w-12 h-12 rounded-xl bg-secondary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{o.product.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{o.statusLabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mb-10">
          <SectionHeader title="Recommended For You" to="/shop" />
          <div className={PRODUCT_GRID_CLASS}>
            {recommended.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>

        <div>
          <SectionHeader title="Recently Viewed" to="/browsing-history" />
          <div className={PRODUCT_GRID_CLASS}>
            {recentlyViewed.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </AccountLayout>
    </>
  );
};

export default DashboardPage;
