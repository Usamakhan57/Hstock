import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Download, ShoppingCart, Search } from 'lucide-react';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const fmtDate = (iso) => (iso
  ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const ORDER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'escrow', label: 'Escrow' },
  { key: 'completed', label: 'Completed' },
  { key: 'refunded', label: 'Refunded' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'disputed', label: 'Disputed' },
];

const SellerOrdersTab = ({ orders = [] }) => {
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let rows = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((o) => (
        String(o.id || '').toLowerCase().includes(q)
        || String(o.product?.title || '').toLowerCase().includes(q)
        || String(o.buyer?.email || o.buyer?.name || '').toLowerCase().includes(q)
        || String(o.paymentStatusLabel || '').toLowerCase().includes(q)
        || String(o.escrowStatusLabel || '').toLowerCase().includes(q)
      ));
    }
    return rows;
  }, [orders, tab, query]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Recent Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">{orders.length} total seller orders</p>
        </div>
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order, buyer, or product…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="mb-5 flex gap-1.5 overflow-x-auto border-b border-border pb-1">
        {ORDER_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No orders here" description="Orders matching this status will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Buyer</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Delivery</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Escrow</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-primary">{o.id}</p>
                      <p className="mt-0.5 max-w-[180px] truncate text-xs text-muted-foreground">{o.product?.title}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {o.buyer?.email || o.buyer?.name || 'Buyer'}
                    </td>
                    <td className="px-5 py-3.5 font-black">{money(o.amount)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(o.date)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {o.deliveryStatusLabel || o.deliveryStatus || (o.product?.deliveryType === 'manual' ? 'Manual' : 'Instant')}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{o.paymentStatusLabel || '—'}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{o.escrowStatusLabel || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/seller/orders`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-secondary"
                          title="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {['completed', 'escrow', 'delivered', 'disputed'].includes(o.status) ? (
                          <Link
                            to={`/orders/${o.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-secondary"
                            title="Download / delivery"
                          >
                            <Download className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrdersTab;
