import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Wallet, CheckCircle2, AlertTriangle, ArrowRight, MessageCircle } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import ProductCard from '../../components/ProductCard';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductGridSkeleton } from '../../components/Skeletons';
import { useStore } from '../../context/StoreContext';
import { useFetch } from '../../hooks/useFetch';
import { ordersApi } from '../../services/ordersApi';
import { paymentsApi } from '../../services/paymentsApi';
import { buildRecentlyViewed, buildRecommended } from '../../services/buyerDashboard';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../constants/commerce';

const STAT_TONES = {
  primary: 'brand-gradient text-white',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  destructive: 'bg-destructive/10 text-destructive',
};

const StatCard = ({ label, value, icon: Icon, tone = 'primary' }) => (
  <div className="bg-white rounded-2xl border border-border p-5 soft-shadow hover:soft-shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${STAT_TONES[tone]}`}>
        <Icon className="w-4.5 h-4.5" />
      </span>
    </div>
    <p className="text-2xl font-black tracking-tight">{value}</p>
  </div>
);

const SectionHeader = ({ title, to }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-bold text-lg">{title}</h2>
    {to && (
      <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-1.5 transition-all">
        View all <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    )}
  </div>
);

const DashboardPage = () => {
  const { user } = useStore();
  const { data: ordersData, loading, error, retry } = useFetch(
    () => ordersApi.list({ page: 1, limit: 50, scope: 'buyer' }),
    [],
  );
  const { data: paymentsData } = useFetch(
    () => paymentsApi.list({ page: 1, limit: 50, scope: 'buyer' }),
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
  const disputedOrders = orders.filter((o) => o.disputeOpen || o.status === ORDER_STATUS.DISPUTED);
  const paidTotal = payments
    .filter((p) => p.status === PAYMENT_STATUS.PAID)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <Seo title="Dashboard" description="Your ApnaStore buyer dashboard overview." noIndex />
      <AccountLayout title="Dashboard" subtitle={`Welcome back${user?.name ? `, ${user.name}` : ''} — here's what's happening with your account.`}>
        {loading ? (
          <ProductGridSkeleton count={4} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" />
        ) : error ? (
          <NetworkErrorState onRetry={retry} message={error.message} />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Active Orders" value={activeOrders.length} icon={Package} tone="primary" />
              <StatCard label="Completed Orders" value={completedOrders.length} icon={CheckCircle2} tone="emerald" />
              <StatCard label="Paid Total" value={`$${paidTotal.toFixed(2)}`} icon={Wallet} tone="amber" />
              <StatCard label="Disputes" value={disputedOrders.length} icon={AlertTriangle} tone="destructive" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-10">
              <div>
                <SectionHeader title="Recent Orders" to="/orders" />
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-white rounded-3xl border border-border p-6">No orders yet — your purchases will show up here.</p>
                ) : (
                  <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden">
                    {orders.slice(0, 4).map((o) => (
                      <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center gap-3 p-4 hover:bg-secondary/40 transition-colors">
                        {o.product.img ? <img src={o.product.img} alt="" className="w-12 h-12 rounded-xl object-cover bg-secondary shrink-0" /> : <span className="w-12 h-12 rounded-xl bg-secondary shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{o.product.title}</p>
                          <p className="text-xs text-muted-foreground">{o.id} · {o.date ? new Date(o.date).toLocaleDateString() : '—'}</p>
                        </div>
                        <span className="text-sm font-bold shrink-0">${o.amount.toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <SectionHeader title="Payment activity" to="/wallet" />
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-white rounded-3xl border border-border p-6">Cryptomus payment activity will show up here after your first purchase.</p>
                ) : (
                  <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden">
                    {payments.slice(0, 4).map((p) => (
                      <Link key={p.id} to={p.orderNumber ? `/orders/${p.orderNumber}` : '/wallet'} className="flex items-center gap-3 p-4 hover:bg-secondary/40 transition-colors">
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

            <div className="mb-10">
              <SectionHeader title="Recent Purchases" to="/downloads" />
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-white rounded-3xl border border-border p-6">Files you purchase will appear here.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {orders.slice(0, 4).map((o) => (
                    <div key={o.id} className="bg-white rounded-3xl border border-border soft-shadow p-4 flex items-center gap-3">
                      {o.product.img ? <img src={o.product.img} alt="" className="w-12 h-12 rounded-xl object-cover bg-secondary shrink-0" /> : <span className="w-12 h-12 rounded-xl bg-secondary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{o.product.title}</p>
                        <p className="text-xs text-muted-foreground">{o.statusLabel}</p>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recommended.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>

        <div>
          <SectionHeader title="Recently Viewed" to="/browsing-history" />
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recentlyViewed.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </AccountLayout>
    </>
  );
};

export default DashboardPage;
