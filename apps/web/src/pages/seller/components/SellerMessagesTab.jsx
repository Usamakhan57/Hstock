import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import EmptyState from '../../../admin/components/EmptyState';
import { NetworkErrorState } from '../../../components/ErrorState';
import { useFetch } from '../../../hooks/useFetch';
import { disputesApi } from '../../../services/disputesApi';
import { DISPUTE_STATUS_LABEL } from '../../../lib/mappers/disputeMappers';

const statusClass = {
  open: 'bg-amber-100 text-amber-700',
  under_review: 'bg-primary/10 text-primary',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-secondary text-muted-foreground',
};

/**
 * Seller dispute inbox — wired to GET /disputes?scope=seller.
 * Secure chat & replacements open on the dispute detail route.
 */
const SellerMessagesTab = () => {
  const [query, setQuery] = useState('');
  const { data, loading, error, retry } = useFetch(
    () => disputesApi.list({ page: 1, limit: 50, scope: 'seller' }),
    [],
  );

  const items = data?.items || [];
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((d) => (
      (d.disputeNumber || '').toLowerCase().includes(q)
      || (d.productTitle || '').toLowerCase().includes(q)
      || (d.reason || '').toLowerCase().includes(q)
    ));
  }, [items, query]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-[1.5rem] bg-secondary" />)}
      </div>
    );
  }

  if (error) {
    return <NetworkErrorState onRetry={retry} message={error.message} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No disputes yet"
        description="When a buyer opens a dispute on your order, the secure conversation will appear here."
      />
    );
  }

  return (
    <div>
      <div className="mb-5 rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Disputes</p>
        <h3 className="mt-1 text-xl font-black">Secure dispute center</h3>
        <p className="mt-1 text-sm text-muted-foreground">Respond, upload evidence, and submit replacement accounts.</p>
        <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search disputes…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No matches" description="Try another search." />
      ) : (
        <ul className="space-y-3">
          {filtered.map((dispute) => (
            <li key={dispute.id}>
              <Link
                to={`/seller/disputes/${dispute.id}`}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-border bg-white p-5 shadow-sm transition hover:border-primary/30 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{dispute.productTitle}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[dispute.status] || 'bg-secondary'}`}>
                      {DISPUTE_STATUS_LABEL[dispute.status] || dispute.statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{dispute.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dispute.disputeNumber}
                    {dispute.createdAt ? ` · ${new Date(dispute.createdAt).toLocaleString()}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">Open chat</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SellerMessagesTab;
