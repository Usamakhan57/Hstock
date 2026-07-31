import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Search } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import { NetworkErrorState } from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { disputesApi } from '../../services/disputesApi';
import { DISPUTE_STATUS_LABEL } from '../../lib/mappers/disputeMappers';

const STATUS_FILTERS = ['all', 'open', 'under_review', 'resolved', 'closed'];

const statusClass = {
  open: 'bg-amber-100 text-amber-700',
  under_review: 'bg-primary/10 text-primary',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-secondary text-muted-foreground',
};

const DisputesPage = () => {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const { data, loading, error, retry } = useFetch(
    () => disputesApi.list({ page: 1, limit: 50, scope: 'buyer' }),
    [],
  );

  const items = data?.items || [];
  const filtered = useMemo(() => {
    let rows = items;
    if (status !== 'all') rows = rows.filter((d) => d.status === status);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((d) => (
        (d.disputeNumber || '').toLowerCase().includes(q)
        || (d.productTitle || '').toLowerCase().includes(q)
        || (d.orderNumber || '').toLowerCase().includes(q)
        || (d.reason || '').toLowerCase().includes(q)
      ));
    }
    return rows;
  }, [items, status, query]);

  return (
    <>
      <Seo title="Dispute Center" description="Track and manage your ApnaStore order disputes." noIndex />
      <AccountLayout title="Dispute Center" subtitle="Open cases, evidence, replacements, and secure chat.">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search disputes…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === s ? 'brand-gradient text-white' : 'border border-border bg-white hover:bg-secondary'}`}
              >
                {s === 'all' ? 'All' : (DISPUTE_STATUS_LABEL[s] || s)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-secondary" />)}
          </div>
        ) : error ? (
          <NetworkErrorState onRetry={retry} message={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No disputes"
            message={items.length === 0 ? 'When you open a dispute on an order, it will appear here.' : 'No disputes match your filters.'}
            actionLabel="View orders"
            actionTo="/orders"
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((dispute) => (
              <li key={dispute.id}>
                <Link
                  to={`/disputes/${dispute.id}`}
                  className="flex flex-col gap-3 rounded-3xl border border-border bg-white p-5 soft-shadow transition hover:border-primary/30 sm:flex-row sm:items-center"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                    {dispute.productImg ? <img src={dispute.productImg} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{dispute.productTitle}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[dispute.status] || 'bg-secondary'}`}>
                        {dispute.statusLabel}
                      </span>
                      {dispute.isPartial && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Partial</span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{dispute.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dispute.disputeNumber}
                      {dispute.orderNumber ? ` · Order ${dispute.orderNumber}` : ''}
                      {' · '}
                      {dispute.disputedQuantity}/{dispute.orderQuantity} items
                      {dispute.createdAt ? ` · ${new Date(dispute.createdAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    <AlertTriangle className="h-4 w-4" /> View
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AccountLayout>
    </>
  );
};

export default DisputesPage;
