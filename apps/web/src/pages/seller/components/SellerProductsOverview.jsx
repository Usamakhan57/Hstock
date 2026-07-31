import React from 'react';
import { TrendingUp, Boxes, CircleCheckBig, Clock3, XCircle, BadgeAlert } from 'lucide-react';

const SellerProductsOverview = ({ products }) => {
  const counters = {
    live: products.filter((p) => p.status === 'live' || p.status === 'published').length,
    pending: products.filter((p) => p.status === 'pending').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
    draft: products.filter((p) => p.status === 'draft').length,
    outOfStock: products.filter((p) => Number(p.stock || 0) <= 0).length,
  };

  const cards = [
    { label: 'Live', value: counters.live, icon: CircleCheckBig, tone: 'text-emerald-600' },
    { label: 'Pending', value: counters.pending, icon: Clock3, tone: 'text-amber-600' },
    { label: 'Rejected', value: counters.rejected, icon: XCircle, tone: 'text-red-600' },
    { label: 'Drafts', value: counters.draft, icon: Boxes, tone: 'text-slate-600' },
    { label: 'Out of stock', value: counters.outOfStock, icon: BadgeAlert, tone: 'text-orange-600' },
  ];

  return (
    <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-[1.25rem] border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">{card.label}</p>
              <Icon className={`h-4 w-4 ${card.tone}`} />
            </div>
            <p className={`mt-3 text-2xl font-black ${card.tone}`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default SellerProductsOverview;
