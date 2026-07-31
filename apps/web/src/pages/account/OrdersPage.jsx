import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { useStore } from '../../context/StoreContext';

const TABS = ['All', 'Processing', 'Completed', 'Disputed'];
const PAGE_SIZE = 5;

const statusStyle = {
  Completed: 'bg-emerald-100 text-emerald-700',
  Processing: 'bg-amber-100 text-amber-700',
  Disputed: 'bg-red-100 text-red-700',
};

const OrdersPage = () => {
  const { orders } = useStore();
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = tab === 'All' || o.status === tab;
      const matchesQuery = !query || o.id.toLowerCase().includes(query.toLowerCase()) || o.product.title.toLowerCase().includes(query.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [orders, tab, query]);

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
              key={t}
              onClick={() => changeTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${tab === t ? 'brand-gradient text-white' : 'bg-white border border-border text-foreground/80 hover:bg-secondary'}`}
            >
              {t}
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

        {filtered.length === 0 ? (
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
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[o.status] || 'bg-secondary'}`}>{o.status}</span>
                    <span className="font-black text-lg">${o.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/product/${o.product.id}`} className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0">
                      <img src={o.product.img} alt={o.product.title} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${o.product.id}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1">{o.product.title}</Link>
                      <p className="text-xs text-muted-foreground">by {o.product.artist || 'HStock Seller'}{o.licenseName ? ` · ${o.licenseName}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Link to={`/orders/${o.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full brand-gradient text-white hover:opacity-95 transition-opacity">
                      View Order Details
                    </Link>
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
