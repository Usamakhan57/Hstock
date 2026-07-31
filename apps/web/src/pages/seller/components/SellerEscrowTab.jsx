import React, { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import StatCard from '../../../admin/components/StatCard';
import StatusBadge from '../../../admin/components/StatusBadge';
import EmptyState from '../../../admin/components/EmptyState';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

/**
 * Reads the real buyer orders from StoreContext (passed down from
 * SellerDashboard) filtered to this seller's products, so a seller can see
 * exactly which sales still have funds held in escrow — pending either the
 * buyer confirming delivery or a dispute being resolved.
 */
const SellerEscrowTab = ({ orders }) => {
  const escrowOrders = useMemo(
    () => orders.filter((o) => o.escrowStatus === 'Held' || o.escrowStatus === 'Disputed'),
    [orders]
  );
  const totalHeld = escrowOrders.reduce((s, o) => s + o.amount, 0);
  const disputedCount = escrowOrders.filter((o) => o.escrowStatus === 'Disputed').length;

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Orders in Escrow" value={escrowOrders.length} icon={ShieldCheck} />
        <StatCard label="Funds Held" value={`$${totalHeld.toFixed(2)}`} icon={ShieldCheck} />
        <StatCard label="Disputed" value={disputedCount} icon={ShieldCheck} />
      </div>

      <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
        {escrowOrders.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Nothing in escrow" description="Orders awaiting buyer confirmation will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order ID</th>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Delivery Status</th>
                  <th className="px-5 py-3 font-semibold">Escrow Status</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {escrowOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3.5 font-medium text-primary">{o.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img src={o.product.img} alt="" className="w-8 h-8 rounded-lg object-cover bg-secondary shrink-0" />
                        <span className="truncate max-w-[200px]">{o.product.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">${o.amount.toFixed(2)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.deliveryStatus === 'Delivered' ? 'completed' : 'pending'} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.escrowStatus === 'Disputed' ? 'cancelled' : 'processing'} /></td>
                    <td className="px-5 py-3.5 text-muted-foreground">{fmtDate(o.date)}</td>
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
