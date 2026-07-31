import React, { useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

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

  const filtered = useMemo(
    () => (tab === 'all' ? orders : orders.filter((o) => o.status === tab)),
    [orders, tab],
  );

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 border-b border-border">
        {ORDER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No orders here" description="Orders matching this status will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order ID</th>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Escrow</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3.5 font-medium text-primary">{o.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {o.product?.img ? <img src={o.product.img} alt="" className="w-8 h-8 rounded-lg object-cover bg-secondary shrink-0" /> : <span className="w-8 h-8 rounded-lg bg-secondary shrink-0" />}
                        <span className="truncate max-w-[200px]">{o.product?.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">${o.amount.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{o.paymentStatusLabel}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{o.escrowStatusLabel}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(o.date)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
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
