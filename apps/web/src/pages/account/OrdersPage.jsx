import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { NetworkErrorState } from '../../components/ErrorState';
import { ProductGridSkeleton } from '../../components/Skeletons';
import { useFetch } from '../../hooks/useFetch';
import { ordersApi } from '../../services/ordersApi';
import { ORDER_STATUS } from '../../constants/commerce';

const TABS = [
  { key: 'All', status: null },
  { key: 'Processing', status: ORDER_STATUS.PAYMENT_PROCESSING },
  { key: 'Pending Payment', status: ORDER_STATUS.PENDING_PAYMENT },
  { key: 'Escrow', status: ORDER_STATUS.ESCROW },
  { key: 'Completed', status: ORDER_STATUS.COMPLETED },
  { key: 'Disputed', status: ORDER_STATUS.DISPUTED },
];
const PAGE_SIZE = 5;

const statusStyle = {
  completed: 'bg-emerald-100 text-emerald-700',
  escrow: 'bg-amber-100 text-amber-700',
  paid: 'bg-amber-100 text-amber-700',
  payment_processing: 'bg-amber-100 text-amber-700',
  pending_payment: 'bg-secondary text-foreground',
  disputed: 'bg-red-100 text-red-700',
  cancelled: 'bg-secondary text-muted-foreground',
  refunded: 'bg-secondary text-muted-foreground',
  expired: 'bg-secondary text-muted-foreground',
  delivered: 'bg-emerald-100 text-emerald-700',
};

const OrdersPage = () => {
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0];
  const { data, loading, error, retry } = useFetch(
    () => ordersApi.list({ page: 1, limit: 100, status: activeTab.status || undefined, scope: 'buyer' }),
    [activeTab.status],
  );

  const orders = data?.items || [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (!needle) return true;
      return o.id.toLowerCase().includes(needle)
        || o.product.title.toLowerCase().includes(needle);
    });
  }, [orders, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeTab = (t) => { setTab(t); setPage(1); };
  const changeQuery = (v) => { setQuery(v); setPage(1); };

  return (
    <>
      <Seo title="My Orders" description="View your HStock order history." noIndex />
      <AccountLayout title="Order History" subtitle="Every purchase you've made, with escrow and access status.">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => changeTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.key ? 'brand-gradient text-white' : 'bg-white border border-border text-foreground/80 hover:bg-secondary'}`}
            >
              {t.key}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border border-border mb-6 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Search by order number or product…"
            aria-label="Search orders"
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

        {loading ? (
          <ProductGridSkeleton count={3} className="space-y-4 grid grid-cols-1" />
        ) : error ? (
          <NetworkErrorState onRetry={retry} message={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
            message={orders.length === 0 ? 'Once you buy something with Buy Now, your order history will show up here.' : 'Try a different tab or search term.'}
            actionLabel="Browse the Shop"
            actionTo="/shop"
          />
        ) : (
          <>
            <div className="space-y-4">
              {pageItems.map((o) => (
                <div key={o.id} className="bg-white rounded-3xl border border-border soft-shadow p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
                    <div>
                      <p className="font-bold text-sm">{o.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {o.date ? new Date(o.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[o.status] || 'bg-secondary'}`}>{o.statusLabel}</span>
                    <span className="font-black text-lg">${o.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={o.product.id ? `/product/${o.product.id}` : '/shop'} className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0">
                      {o.product.img ? <img src={o.product.img} alt={o.product.title} className="w-full h-full object-cover" /> : null}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={o.product.id ? `/product/${o.product.id}` : '/shop'} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1">{o.product.title}</Link>
                      <p className="text-xs text-muted-foreground">
                        by {o.product.artist || 'HStock Seller'} · Payment {o.paymentStatusLabel} · Escrow {o.escrowStatusLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Link to={`/orders/${o.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full brand-gradient text-white hover:opacity-95 transition-opacity">
                      View Order Details
                    </Link>
                    {o.status === ORDER_STATUS.PENDING_PAYMENT && o.paymentUrl && (
                      <a href={o.paymentUrl} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border border-border hover:bg-secondary transition-colors">
                        Continue Payment
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-9 h-9 grid place-items-center rounded-full border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-muted-foreground px-2">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-9 h-9 grid place-items-center rounded-full border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </AccountLayout>
    </>
  );
};

export default OrdersPage;
