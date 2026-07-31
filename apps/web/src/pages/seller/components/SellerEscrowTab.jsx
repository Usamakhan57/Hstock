import React, { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import StatCard from '../../../admin/components/StatCard';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const SellerEscrowTab = ({ escrowItems = [] }) => {
  const active = useMemo(
    () => escrowItems.filter((e) => e.status === 'locked' || e.status === 'disputed' || e.status === 'pending'),
    [escrowItems],
  );
  const totalHeld = active.reduce((s, e) => s + (e.sellerAmount || e.amount || 0), 0);
  const disputedCount = active.filter((e) => e.status === 'disputed').length;

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Orders in Escrow" value={active.length} icon={ShieldCheck} />
        <StatCard label="Funds Held" value={`$${totalHeld.toFixed(2)}`} icon={ShieldCheck} />
        <StatCard label="Disputed" value={disputedCount} icon={ShieldCheck} />
      </div>

      <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
        {active.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Nothing in escrow" description="Paid orders awaiting auto-release will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order ID</th>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Seller Amount</th>
                  <th className="px-5 py-3 font-semibold">Release At</th>
                  <th className="px-5 py-3 font-semibold">Escrow Status</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {active.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3.5 font-medium text-primary">{e.orderNumber || e.orderId || e.id}</td>
                    <td className="px-5 py-3.5"><span className="truncate max-w-[200px] inline-block">{e.productTitle}</span></td>
                    <td className="px-5 py-3.5 font-semibold">${(e.sellerAmount || e.amount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(e.releaseAt)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={e.status === 'disputed' ? 'cancelled' : e.status === 'locked' ? 'processing' : e.status} /></td>
                    <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(e.date)}</td>
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

export default SellerEscrowTab;
