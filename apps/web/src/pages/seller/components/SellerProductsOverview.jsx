import React from 'react';
import {
  CircleCheckBig,
  Boxes,
  Clock3,
  XCircle,
  BadgeAlert,
  EyeOff,
  Package,
} from 'lucide-react';

const SellerProductsOverview = ({ products = [], onFilter }) => {
  const counters = {
    total: products.length,
    live: products.filter((p) => p.status === 'live' || p.status === 'published').length,
    disabled: products.filter((p) => p.status === 'disabled' || p.status === 'archived').length,
    pending: products.filter((p) => p.status === 'pending').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
    draft: products.filter((p) => p.status === 'draft').length,
    outOfStock: products.filter((p) => p.stockType !== 'unlimited' && Number(p.stock || 0) <= 0).length,
  };

  const cards = [
    { key: 'all', label: 'Total', value: counters.total, icon: Package, tone: 'text-foreground', bg: 'bg-secondary' },
    { key: 'live', label: 'Live', value: counters.live, icon: CircleCheckBig, tone: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'disabled', label: 'Disabled', value: counters.disabled, icon: EyeOff, tone: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'pending', label: 'Pending', value: counters.pending, icon: Clock3, tone: 'text-sky-600', bg: 'bg-sky-50' },
    { key: 'rejected', label: 'Rejected', value: counters.rejected, icon: XCircle, tone: 'text-red-600', bg: 'bg-red-50' },
    { key: 'out_of_stock', label: 'Out of Stock', value: counters.outOfStock, icon: BadgeAlert, tone: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onFilter?.(card.key)}
            className="rounded-[1.25rem] border border-border bg-white p-4 text-left shadow-sm transition hover:border-primary/25 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.tone}`} />
              </span>
            </div>
            <p className={`mt-3 text-2xl font-black ${card.tone}`}>{card.value}</p>
          </button>
        );
      })}
      <div className="col-span-2 hidden rounded-[1.25rem] border border-dashed border-border bg-secondary/30 p-4 md:col-span-3 xl:col-span-6 xl:hidden">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Boxes className="h-4 w-4" />
          Drafts: {counters.draft}
        </div>
      </div>
    </div>
  );
};

export default SellerProductsOverview;
